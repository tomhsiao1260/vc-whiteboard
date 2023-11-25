import * as THREE from 'three'
import PubSub from "pubsub-js";
import { TextureLoader } from 'three'
import { FragmentShader } from './FragmentShader'
import { TIFFLoader } from 'three/addons/loaders/TIFFLoader.js'
import { ArcballControls } from 'three/addons/controls/ArcballControls.js'

export default class Card {
  constructor(_option) {
    this.scene = null
    this.camera = null
    this.controls = null
    this.renderer = null
    this.segmentID = null

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
    this.camera.position.copy(new THREE.Vector3(0.4, -0.4, -1.0).multiplyScalar(1.0))
    this.camera.up.set(0, -1, 0)
    this.camera.far = 5
    this.camera.updateProjectionMatrix()

    // camera controls
    this.controls = new ArcballControls(this.camera, this.canvas, this.scene)
  }

  async create(segmentID, uuid, info) {
    const texture = await new TIFFLoader().loadAsync(`${segmentID}.tif`)

    let mtexture = null
    if (segmentID === '20230509182749') { mtexture = await new TextureLoader().loadAsync('20230509182749-mask.png') }

    const material = new FragmentShader()
    material.uniforms.tDiffuse.value = texture
    material.uniforms.uMask.value = mtexture

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(info.w / info.h, 1), material)
    this.scene.add(mesh)

    this.segmentID = segmentID

    this.render()
    this.time.trigger('tick')
    this.app.API.cardLoad(uuid)

    PubSub.publish("onFinishLoad", { id: uuid })
  }

  render() {
    if (!this.renderer) return

    this.renderer.setRenderTarget(this.buffer)
    this.renderer.clear()

    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)
  }
}
