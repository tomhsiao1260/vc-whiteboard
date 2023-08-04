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
  constructor({ volumeMeta, segmentMeta }) {
    this.renderer = null
    this.scene = null
    this.camera = null
    this.mode = null

    this.mesh = null
    this.sdfTex = null
    this.volumeTex = null
    this.volumeTarget = null
    this.clipGeometry = null

    this.volumeMeta = volumeMeta
    this.segmentMeta = segmentMeta
    this.render = this.render.bind(this)
    this.canvas = document.querySelector('.webgl')
    this.inverseBoundsMatrix = new THREE.Matrix4()
    this.boxHelper = new THREE.Box3Helper(new THREE.Box3())
    this.cmtextures = { viridis: new THREE.TextureLoader().load(textureViridis) }
    this.volumePass = new FullScreenQuad(new VolumeMaterial())
    this.layerPass = new FullScreenQuad(new RenderSDFLayerMaterial())

    this.params = {}
    this.params.mode = 'layer'
    // this.params.mode = 'volume-segment'
    this.params.surface = 0.005
    this.params.layer = 0
    this.params.inverse = false
    this.params.layers = { select: 0, options: {} }

    this.init()
  }

  init() {
    // renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvas })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

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

    const controls = new OrbitControls(this.camera, this.canvas)
    controls.addEventListener('change', this.render)

    // list all layer options
    for (let i = 0; i < this.volumeMeta.nrrd.length; i++) {
      const { clip } = this.volumeMeta.nrrd[i]
      const start = clip.z
      const end = clip.z + clip.d
      this.params.layers.options[ `${start} to ${end}` ] = i
    }
  }

  clear() {
    if (this.sdfTex) { this.sdfTex.dispose(); this.sdfTex = null }
    if (this.volumeTex) { this.volumeTex.dispose(); this.volumeTex = null }
    if (this.clipGeometry) { this.clipGeometry.dispose(); this.clipGeometry = null }

    if (this.mesh) {
      this.mesh.geometry.dispose()
      this.mesh.material.dispose()
      this.scene.remove(this.mesh)
      this.mesh = null
    } 
  }

  async updateVolume() {
    if (!this.volumeMeta) { console.log('volume meta.json not found'); return }

    const id = this.params.layers.select
    const volumeTarget = this.volumeMeta.nrrd[id]
    const clip = volumeTarget.clip
    const nrrd = volumeTarget.shape

    const matrix = new THREE.Matrix4()
    const center = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scaling = new THREE.Vector3()
    const s = 1 / Math.max(nrrd.w, nrrd.h, nrrd.d)

    scaling.set(nrrd.w * s, nrrd.h * s, nrrd.d * s)
    matrix.compose(center, quat, scaling)
    this.inverseBoundsMatrix.copy(matrix).invert()

    await Loader.getVolumeData(volumeTarget.id + '.nrrd').then((volume) => {
      this.volumeTex = new THREE.Data3DTexture(volume.data, volume.xLength, volume.yLength, volume.zLength)

      this.volumeTex.format = THREE.RedFormat
      this.volumeTex.type = THREE.FloatType
      this.volumeTex.minFilter = THREE.LinearFilter
      this.volumeTex.magFilter = THREE.LinearFilter
      this.volumeTex.unpackAlignment = 1
      this.volumeTex.needsUpdate = true

      this.layerPass.material.uniforms.voldata.value = this.volumeTex
      this.volumePass.material.uniforms.voldata.value = this.volumeTex
      this.volumePass.material.uniforms.size.value.set(volume.xLength, volume.yLength, volume.zLength)
    })
  }

  async updateSegment() {
    if (!this.volumeMeta) { console.log('volume meta.json not found'); return }
    if (!this.segmentMeta) { console.log('segment meta.json not found'); return }

    const id = this.params.layers.select
    const volumeTarget = this.volumeMeta.nrrd[id]
    const vc = volumeTarget.clip

    // select necessary segment to list
    const segmentList = []
    const geometryList = []

    for (let i = 0; i < this.segmentMeta.obj.length; i++) {
      const segmentTarget = this.segmentMeta.obj[i]
      const sc = segmentTarget.clip

      if (vc.x + vc.w >= sc.x && sc.x + sc.w >= vc.x) {
        if (vc.y + vc.h >= sc.y && sc.y + sc.h >= vc.y) {
          if (vc.z + vc.d >= sc.z && sc.z + sc.d >= vc.z) {
            const loading = Loader.getSegmentData(segmentTarget.id + '.obj')
              .then((object) => { geometryList.push(object.children[0].geometry) })

            segmentList.push(loading)
          }
        }
      }
    }
    await Promise.all(segmentList)

    // turn all segment into single geometry
    const geometry = BufferGeometryUtils.mergeGeometries(geometryList, true)
    const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })

    const s = 1 / Math.max(vc.w, vc.h, vc.d)
    const center = new THREE.Vector3(- vc.x - vc.w/2, - vc.y - vc.h/2, - vc.z - vc.d/2)

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.scale.multiplyScalar(s)
    this.mesh.position.add(center.multiplyScalar(s))
    this.scene.add(this.mesh)

    this.boxHelper.box.max.set(vc.w * s / 2,  vc.h * s / 2,  vc.d * s / 2)
    this.boxHelper.box.min.set(-vc.w * s / 2, -vc.h * s / 2, -vc.d * s / 2)

    // clear the original geometry
    for (let i = 0; i < geometryList.length; i ++) { geometryList[i].dispose() }
  }

  clipSegment() {
    if (!this.volumeMeta) { console.log('volume meta.json not found'); return }

    const id = this.params.layers.select
    const volumeTarget = this.volumeMeta.nrrd[id]
    const clip = volumeTarget.clip
    const nrrd = volumeTarget.shape

    let select = false
    const s = 1 / Math.max(nrrd.w, nrrd.h, nrrd.d)

    const geometry = this.mesh.geometry
    const positions = geometry.getAttribute('position').array
    const normals = geometry.getAttribute('normal').array
    const uvs = geometry.getAttribute('uv').array

    const c_positions = []
    const c_normals = []
    const c_uvs = []

    const boundingBox = new THREE.Box3(
      new THREE.Vector3(clip.x, clip.y, clip.z),
      new THREE.Vector3(clip.x + clip.w, clip.y + clip.h, clip.z + clip.d)
    )

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

    this.clipGeometry = new THREE.BufferGeometry()
    this.clipGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(c_positions), 3))
    this.clipGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c_uvs), 2))
    this.clipGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(c_normals), 3))
  }

  updateSegmentSDF() {
    if (!this.volumeMeta) { console.log('volume meta.json not found'); return }

    const id = this.params.layers.select
    const volumeTarget = this.volumeMeta.nrrd[id]
    const clip = volumeTarget.clip
    const nrrd = volumeTarget.shape

    const r = 1.0
    const s = 1 / Math.max(nrrd.w, nrrd.h, nrrd.d)

    // create a new 3d render target texture
    // this.sdfTex = new THREE.WebGL3DRenderTarget(nrrd.w * r, nrrd.h * r, nrrd.d * r)
    // change
    this.sdfTex = new THREE.WebGLArrayRenderTarget(nrrd.w * r, nrrd.h * r, nrrd.d * r)
    this.sdfTex.texture.format = THREE.RedFormat
    // this.sdfTex.texture.format = THREE.RGFormat
    this.sdfTex.texture.type = THREE.FloatType
    this.sdfTex.texture.minFilter = THREE.LinearFilter
    this.sdfTex.texture.magFilter = THREE.LinearFilter

    // prep the sdf generation material pass
    const matrix = new THREE.Matrix4()
    const center = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scaling = new THREE.Vector3()

    scaling.set(nrrd.w * s, nrrd.h * s, nrrd.d * s)
    matrix.compose(center, quat, scaling)

    const bvh = new MeshBVH(this.clipGeometry, { maxLeafTris: 1 })
    const generateSdfPass = new FullScreenQuad(new GenerateSDFMaterial())
    generateSdfPass.material.uniforms.bvh.value.updateFrom(bvh)
    generateSdfPass.material.uniforms.matrix.value.copy(matrix)

    // render into each layer
    const pxWidth = 1 / (nrrd.d * r)
    const halfWidth = 0.5 * pxWidth

    for (let i = 0; i < nrrd.d * r; i++) {
      // don't need to change beacuase of bvh calculation within 0~1
      generateSdfPass.material.uniforms.zValue.value = i * pxWidth + halfWidth
      this.renderer.setRenderTarget(this.sdfTex, i)
      generateSdfPass.render(this.renderer)
    }
    this.renderer.setRenderTarget(null)
    generateSdfPass.material.dispose()
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

      const sdft = this.sdfTex
      const cmt = this.cmtextures.viridis
      if (cmt) this.volumePass.material.uniforms.cmdata.value = cmt
      if (sdft) this.volumePass.material.uniforms.sdfTex.value = sdft.texture

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

      const sdft = this.sdfTex
      const cmt = this.cmtextures.viridis
      if (cmt) this.layerPass.material.uniforms.cmdata.value = cmt
      if (sdft) this.layerPass.material.uniforms.sdfTex.value = sdft.texture

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
