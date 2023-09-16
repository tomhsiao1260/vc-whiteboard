import * as THREE from 'three'
import { TextureLoader } from 'three'
import { HintShader } from './HintShader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default class Hint {
  constructor(_option) {
    this.scene = null
    this.camera = null
    this.renderer = null

    this.time = _option.time
    this.app = _option.app
    this.canvas = _option.canvas
    this.renderer = _option.renderer
    this.width = _option.info.w
    this.height = _option.info.h
    this.buffer = new THREE.WebGLRenderTarget(this.width, this.height)

    this.init()
  }

  init() {
    // scene setup
    this.scene = new THREE.Scene()

    // camera setup
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 50)
    this.camera.updateProjectionMatrix()

    // camera controls
    this.controls = new OrbitControls(this.camera, this.canvas)
  }

  async create(segmentID, uuid, info) {
    const texture = await new TextureLoader().loadAsync('Stitching_Megas.png')

    const material = new HintShader()
    material.uniforms.tDiffuse.value = texture

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(info.w / info.h, 1), material)
    this.scene.add(mesh)

    this.render()
    this.time.trigger('tick')
    this.app.API.cardLoad(uuid)
  }

  render() {
    if (!this.renderer) return

    this.renderer.setRenderTarget(this.buffer)
    this.renderer.clear()

    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)
  }
}
