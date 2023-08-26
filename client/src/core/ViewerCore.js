import * as THREE from 'three'
import Loader from '../Loader'
import textureViridis from './textures/cm_viridis.png'
import { MeshBVH } from 'three-mesh-bvh'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'

import { VolumeMaterial } from './VolumeMaterial'
import { GenerateSDFMaterial } from './GenerateSDFMaterial'
import { RenderSDFLayerMaterial } from './RenderSDFLayerMaterial'

export default class ViewerCore {
  constructor({ data, renderer, canvas }) {
    this.scene = null
    this.camera = null
    this.controls = null
    this.clipGeometry = null
    this.focusGeometry = null
    this.bvh = null

    this.volumeList = {}
    this.segmentList = {}
    this.volumeMeta = data.volumeMeta
    this.segmentMeta = data.segmentMeta
    this.canvas = canvas
    this.renderer = renderer
    this.render = this.render.bind(this)
    this.inverseBoundsMatrix = new THREE.Matrix4()
    this.boxHelper = new THREE.Box3Helper(new THREE.Box3())
    this.cmtextures = { viridis: new THREE.TextureLoader().load(textureViridis) }
    this.volumePass = new FullScreenQuad(new VolumeMaterial())
    this.layerPass = new FullScreenQuad(new RenderSDFLayerMaterial())

    this.params = {}
    this.params.mode = 'layer'
    // this.params.mode = 'volume-segment'
    this.params.surface = 0.003
    this.params.layer = 0
    this.params.inverse = false
    this.params.layers = { select: 0, options: {} }

    this.init()
  }

  init() {
    // scene setup
    this.scene = new THREE.Scene()
    this.scene.add(this.boxHelper)

    // camera setup
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50)
    this.camera.position.copy(new THREE.Vector3(0.4, -0.4, -1.0).multiplyScalar(1.0))
    this.camera.up.set(0, -1, 0)
    this.camera.far = 5
    this.camera.updateProjectionMatrix()

    window.addEventListener(
      'resize',
      () => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.render()
      },
      false
    )

    // camera controls
    this.controls = new OrbitControls(this.camera, this.canvas)

    // list all layer options
    for (let i = 0; i < this.volumeMeta.nrrd.length; i++) {
      const { clip } = this.volumeMeta.nrrd[i]
      const start = clip.z
      const end = clip.z + clip.d
      this.params.layers.options[ `${start} to ${end}` ] = i
    }
  }

  clear() {
  }

  async updateVolume() {
    if (!this.volumeMeta) { console.log('volume meta.json not found'); return }

    const id = this.params.layers.select
    const vTarget = this.volumeMeta.nrrd[id]
    const clip = vTarget.clip
    const nrrd = vTarget.shape
    const vID = vTarget.id

    // return if current volume already exist
    if (this.volumeList[vID]) return
    // update list if current volume don't exist
    if (!this.volumeList[vID]) { this.volumeList = {}; this.volumeList[vID] = vTarget }

    const matrix = new THREE.Matrix4()
    const center = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scaling = new THREE.Vector3()
    const s = 1 / Math.max(nrrd.w, nrrd.h, nrrd.d)

    scaling.set(nrrd.w * s, nrrd.h * s, nrrd.d * s)
    matrix.compose(center, quat, scaling)
    this.inverseBoundsMatrix.copy(matrix).invert()

    await Loader.getVolumeData(vID + '.nrrd').then((volume) => {
      const volumeTex = new THREE.Data3DTexture(volume.data, volume.xLength, volume.yLength, volume.zLength)

      volumeTex.format = THREE.RedFormat
      volumeTex.type = THREE.FloatType
      volumeTex.minFilter = THREE.LinearFilter
      volumeTex.magFilter = THREE.LinearFilter
      volumeTex.unpackAlignment = 1
      volumeTex.needsUpdate = true

      this.layerPass.material.uniforms.voldata.value = volumeTex
      this.layerPass.material.uniforms.cmdata.value = this.cmtextures.viridis
      this.volumePass.material.uniforms.voldata.value = volumeTex
      this.volumePass.material.uniforms.cmdata.value = this.cmtextures.viridis
      this.volumePass.material.uniforms.size.value.set(volume.xLength, volume.yLength, volume.zLength)
    })
  }

  async updateSegment() {
    if (!this.volumeMeta) { console.log('volume meta.json not found'); return }
    if (!this.segmentMeta) { console.log('segment meta.json not found'); return }

    const deleteList = []
    const createList = []

    const id = this.params.layers.select
    const vTarget = this.volumeMeta.nrrd[id]
    const vc = vTarget.clip

    // decide which segmentation to delete or create
    for (let i = 0; i < this.segmentMeta.obj.length; i++) {
      const sTarget = this.segmentMeta.obj[i]
      const sID = sTarget.id
      const sc = sTarget.clip

      const state = {}
      state.current = false
      state.previous = (this.segmentList[sID]) ? true : false

      if (vc.x + vc.w >= sc.x && sc.x + sc.w >= vc.x) {
        if (vc.y + vc.h >= sc.y && sc.y + sc.h >= vc.y) {
          if (vc.z + vc.d >= sc.z && sc.z + sc.d >= vc.z) {
            state.current = true
          }
        }
      }
      if (state.previous && !state.current) { deleteList.push(sTarget) }
      if (!state.previous && state.current) { createList.push(sTarget) }
    }

    // delete
    deleteList.forEach((sTarget) => {
      const sID = sTarget.id
      delete this.segmentList[sID]

      const mesh = this.scene.getObjectByName(sID)
      if (mesh) {
        mesh.geometry.dispose()
        mesh.material.dispose()
        mesh.geometry = null
        mesh.material = null
        this.scene.remove(mesh)
      }
    })

    // create
    const loadingList = []
    const normalMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
    const basicMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 'red' })

    createList.forEach((sTarget) => {
      const sID = sTarget.id
      this.segmentList[sID] = sTarget

      const loading = Loader.getSegmentData(sID + '.obj')
      loading.then((object) => {
        const geometry = object.children[0].geometry                          
        const mesh = new THREE.Mesh(geometry, normalMaterial)
        mesh.userData = sTarget
        mesh.name = sID
        this.scene.add(mesh)
      })
      loadingList.push(loading)
    })
    await Promise.all(loadingList)

    // position, scale & labeling
    const s = 1 / Math.max(vc.w, vc.h, vc.d)
    const center = new THREE.Vector3(- vc.x - vc.w/2, - vc.y - vc.h/2, - vc.z - vc.d/2)
    this.scene.children.forEach((mesh) => {
      const sID = mesh.userData.id
      if (sID) {
        mesh.scale.set(s, s, s)
        mesh.position.copy(center.clone().multiplyScalar(s))

        const isFocus = this.segmentList[sID].focus
        const isNormal = mesh.material.type === 'MeshNormalMaterial'
        if (isFocus && isNormal) { mesh.material = basicMaterial }
        if (!isFocus && !isNormal) { mesh.material = normalMaterial }
      }
    })

    // helper
    this.boxHelper.box.max.set(vc.w * s / 2,  vc.h * s / 2,  vc.d * s / 2)
    this.boxHelper.box.min.set(-vc.w * s / 2, -vc.h * s / 2, -vc.d * s / 2)
  }

  clipSegment() {
    if (!this.volumeMeta) { console.log('volume meta.json not found'); return }

    this.updateClipGeometry()
    this.updateFocusGeometry()
  }

  updateClipGeometry() {
    const id = this.params.layers.select
    const vTarget = this.volumeMeta.nrrd[id]
    const clip = vTarget.clip
    const nrrd = vTarget.shape

    // return if current clip geometry already exist
    if (this.clipGeometry) {
      if (this.clipGeometry.userData.id === id) return
      this.clipGeometry.dispose()
      this.clipGeometry = null
    }

    let select = false
    const s = 1 / Math.max(nrrd.w, nrrd.h, nrrd.d)

    const c_positions = []
    const c_normals = []
    const c_uvs = []
    const chunkList = []

    const boundingBox = new THREE.Box3(
      new THREE.Vector3(clip.x, clip.y, clip.z),
      new THREE.Vector3(clip.x + clip.w, clip.y + clip.h, clip.z + clip.d)
    )

    this.scene.children.forEach((mesh) => {
      if (mesh.userData.id) {
        const positions = mesh.geometry.getAttribute('position').array
        const normals = mesh.geometry.getAttribute('normal').array
        const uvs = mesh.geometry.getAttribute('uv').array

        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i + 0]
          const y = positions[i + 1]
          const z = positions[i + 2]

          if (i % 9 == 0) { select = boundingBox.containsPoint(new THREE.Vector3(x, y, z)) }

          if (select) {
            const newX = nrrd.w * s * ((x - clip.x) / clip.w - 0.5)
            const newY = nrrd.h * s * ((y - clip.y) / clip.h - 0.5)
            const newZ = nrrd.d * s * ((z - clip.z) / clip.d - 0.5)

            c_positions.push(newX, newY, newZ)
            c_uvs.push(uvs[2 * i + 0], uvs[2 * i + 1])
            c_normals.push(normals[3 * i + 0], normals[3 * i + 1], normals[3 * i + 2])
          }
        }
        chunkList.push({ id: mesh.userData.id, maxIndex: c_positions.length / 3 })
      }
    })

    this.clipGeometry = new THREE.BufferGeometry()
    this.clipGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(c_positions), 3))
    this.clipGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c_uvs), 2))
    this.clipGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(c_normals), 3))
    this.clipGeometry.userData.chunkList = chunkList
    this.clipGeometry.userData.id = id
  }

  updateFocusGeometry() {
    const q = { start: 0, end: 0, sID: null, vID: null }
    const { chunkList } = this.clipGeometry.userData
    for (let i = 0; i < chunkList.length; i += 1) {
      const { id: sID } = chunkList[i]
      if (this.segmentList[sID].focus) {
        q.sID = sID
        q.vID = this.params.layers.select
        q.end = chunkList[i].maxIndex
        q.start = (i === 0) ? 0 : chunkList[i - 1].maxIndex
        break
      }
    }
    if (!q.end && !this.focusGeometry) return
    if (!q.end) { this.focusGeometry.dispose(); this.focusGeometry = null; return }
    // return if current focus geometry already exist
    const f = this.focusGeometry
    if (f && f.userData.sID === q.sID && f.userData.vID === q.vID) return

    const f_positions = this.clipGeometry.getAttribute('position').array.slice(q.start * 3, q.end * 3)
    const f_normals = this.clipGeometry.getAttribute('normal').array.slice(q.start * 3, q.end * 3)
    const f_uvs = this.clipGeometry.getAttribute('uv').array.slice(q.start * 2, q.end * 2)

    this.focusGeometry = new THREE.BufferGeometry()
    this.focusGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(f_positions), 3))
    this.focusGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(f_uvs), 2))
    this.focusGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(f_normals), 3))
    this.focusGeometry.userData = q
  }

  updateSegmentSDF() {
    if (!this.volumeMeta) { console.log('volume meta.json not found'); return }

    this.updateClipSDF()
    this.updateFocusSDF()
  }

  updateClipSDF() {
    // return if current bvh already exist
    const id = this.params.layers.select

    if (this.bvh) {
      if (this.bvh.geometry.userData.id === id) return
      this.bvh.geometry.dispose()
      this.bvh.geometry = null
      this.bvh = null
    }

    const [ sdfTex, bvh ] = this.sdfTexGenerate(this.clipGeometry)
    this.bvh = bvh
    this.volumePass.material.uniforms.sdfTex.value = sdfTex.texture
    this.layerPass.material.uniforms.sdfTex.value = sdfTex.texture
  }

  updateFocusSDF() {
    // return if texture is alreay loaded
    const f = this.focusGeometry
    const ft = this.layerPass.material.uniforms.sdfTexFocus.value
    if (f && ft && ft.name === `v${f.userData.vID}s${f.userData.sID}`) return

    const [ sdfTexFocus, _ ] = this.sdfTexGenerate(this.focusGeometry)
    sdfTexFocus.texture.name = f ? `v${f.userData.vID}s${f.userData.sID}` : ''
    this.volumePass.material.uniforms.sdfTexFocus.value = sdfTexFocus.texture
    this.layerPass.material.uniforms.sdfTexFocus.value = sdfTexFocus.texture
  }

  sdfTexGenerate(geometry) {
    const id = this.params.layers.select
    const vTarget = this.volumeMeta.nrrd[id]
    const clip = vTarget.clip
    const nrrd = vTarget.shape

    const r = 1.0
    const s = 1 / Math.max(nrrd.w, nrrd.h, nrrd.d)

    // create a new 3d render target texture
    // const sdfTex = new THREE.WebGL3DRenderTarget(nrrd.w * r, nrrd.h * r, nrrd.d * r)
    // change
    const sdfTex = new THREE.WebGLArrayRenderTarget(nrrd.w * r, nrrd.h * r, nrrd.d * r)
    sdfTex.texture.format = THREE.RedFormat
    // sdfTex.texture.format = THREE.RGFormat
    sdfTex.texture.type = THREE.FloatType
    sdfTex.texture.minFilter = THREE.LinearFilter
    sdfTex.texture.magFilter = THREE.LinearFilter

    // prep the sdf generation material pass
    const matrix = new THREE.Matrix4()
    const center = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scaling = new THREE.Vector3()

    scaling.set(nrrd.w * s, nrrd.h * s, nrrd.d * s)
    matrix.compose(center, quat, scaling)

    // return if current focus geometry is empty
    if (!geometry) return [ sdfTex, null ]
    if (!geometry.getAttribute('position').count) return [ sdfTex, null ]

    const bvh = new MeshBVH(geometry, { maxLeafTris: 1 })
    const generateSdfPass = new FullScreenQuad(new GenerateSDFMaterial())
    generateSdfPass.material.uniforms.bvh.value.updateFrom(bvh)
    generateSdfPass.material.uniforms.matrix.value.copy(matrix)

    // render into each layer
    const pxWidth = 1 / (nrrd.d * r)
    const halfWidth = 0.5 * pxWidth

    for (let i = 0; i < nrrd.d * r; i++) {
      // don't need to change beacuase of bvh calculation within 0~1
      generateSdfPass.material.uniforms.zValue.value = i * pxWidth + halfWidth
      this.renderer.setRenderTarget(sdfTex, i)
      generateSdfPass.render(this.renderer)
    }
    this.renderer.setRenderTarget(null)
    generateSdfPass.material.dispose()

    return [ sdfTex, bvh ]
  }

  getLabel(mouse) {
    // labeling in segment mode
    if (this.params.mode === 'segment') {
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, this.camera)
      const intersects = raycaster.intersectObjects(this.scene.children)

      for (let i = 0; i < intersects.length; i++) {
        const mesh = intersects[i].object
        const sID = mesh.userData.id
        if (sID) {
          for (const sID in this.segmentList) { this.segmentList[sID].focus = false }
          this.segmentList[sID].focus = true
          return this.segmentList[sID]
        }
      }
    }

    // labeling in layer mode
    if (this.params.mode === 'layer') {
      const id = this.params.layers.select
      const vTarget = this.volumeMeta.nrrd[id]
      const clip = vTarget.clip
      const nrrd = vTarget.shape

      const s = 1 / Math.max(nrrd.w, nrrd.h, nrrd.d)
      const l = (this.params.layer - clip.z) / clip.d - 0.5
      const aspect = window.innerWidth / window.innerHeight

      const point = new THREE.Vector3()
      point.z = nrrd.d * s * l
      point.x = nrrd.w * s * mouse.x / 2 * aspect
      point.y = nrrd.h * s * mouse.y / 2 * (-1)

      if (!this.bvh) return
      const target = this.bvh.closestPointToPoint(point, {}, 0, 0.02)
      if (!target) return

      const { chunkList } = this.bvh.geometry.userData
      const hitIndex = this.bvh.geometry.index.array[target.faceIndex * 3]

      for (let i = 0; i < chunkList.length; i ++) {
        const { id: sID, maxIndex } = chunkList[i]
        if (maxIndex > hitIndex) {
          for (const sID in this.segmentList) { this.segmentList[sID].focus = false }
          this.segmentList[sID].focus = true
          return this.segmentList[sID]
        }
      }
    }
  }

  render() {
    if (!this.renderer) return

    // segment mode
    if (this.params.mode === 'segment') {
      this.renderer.render(this.scene, this.camera)
    }
    // volume & volume-segment mode
    if (this.params.mode === 'volume' || this.params.mode === 'volume-segment') {
      this.camera.updateMatrixWorld()

      const id = this.params.layers.select
      const shape = this.volumeMeta.nrrd[id].shape

      this.volumePass.material.uniforms.clim.value.set(0.5, 0.9)
      this.volumePass.material.uniforms.renderstyle.value = 0 // 0: MIP, 1: ISO
      this.volumePass.material.uniforms.surface.value = this.params.surface
      // change
      this.volumePass.material.uniforms.thickness.value = shape.d
      this.volumePass.material.uniforms.renderthreshold.value = 0.15 // For ISO renderstyle
      this.volumePass.material.uniforms.segmentMode.value = (this.params.mode === 'volume-segment')
      this.volumePass.material.uniforms.projectionInverse.value.copy(this.camera.projectionMatrixInverse)
      this.volumePass.material.uniforms.sdfTransformInverse.value.copy(new THREE.Matrix4()).invert().premultiply(this.inverseBoundsMatrix).multiply(this.camera.matrixWorld)
      this.volumePass.render(this.renderer)
    }
    // layer & grid layer mode
    if (this.params.mode === 'layer' || this.params.mode === 'grid layer') {
      const id = this.params.layers.select
      const clip = this.volumeMeta.nrrd[id].clip
      const shape = this.volumeMeta.nrrd[id].shape

      const gridMode = this.params.mode === 'layer' ? 0 : 1
      if (gridMode !== this.layerPass.material.defines.DISPLAY_GRID) {
        this.layerPass.material.defines.DISPLAY_GRID = gridMode
        this.layerPass.material.needsUpdate = true
      }

      this.layerPass.material.uniforms.clim.value.set(0.5, 0.9)
      this.layerPass.material.uniforms.inverse.value = this.params.inverse
      this.layerPass.material.uniforms.surface.value = this.params.surface
      // change
      this.layerPass.material.uniforms.thickness.value = shape.d
      this.layerPass.material.uniforms.layer.value = (this.params.layer - clip.z) / clip.d
      this.layerPass.material.uniforms.volumeAspect.value = clip.w / clip.h
      this.layerPass.material.uniforms.screenAspect.value = this.camera.aspect
      this.layerPass.render(this.renderer)
    }
  }
}
