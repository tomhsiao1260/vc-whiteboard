import * as THREE from 'three'
import PubSub from "pubsub-js";
import { TextureLoader } from 'three'
import { ImageShader } from './ImageShader'

export default class Image {
  constructor(_option) {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.width = null
    this.height = null
    this.buffer = null

    this.time = _option.time
    this.renderer = _option.renderer

    this.init()
  }

  init() {
    // scene setup
    this.scene = new THREE.Scene()

    // camera setup
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 50)
    this.camera.updateProjectionMatrix()
  }

  async create(blob, uuid, card) {
    const blobUrl = URL.createObjectURL(blob)
    const texture = await new TextureLoader().loadAsync(blobUrl)

    const material = new ImageShader()
    material.uniforms.tDiffuse.value = texture

    this.width = texture.image.width
    this.height = texture.image.height
    this.buffer = new THREE.WebGLRenderTarget(this.width, this.height)

    card.material.uniforms.tDiffuse.value = this.buffer.texture
    card.userData.w = this.width
    card.userData.h = this.height

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(this.width / this.height, 1), material)
    this.scene.add(mesh)

    this.render()
    this.time.trigger('tick')

    PubSub.publish("onFinishLoad", { id: uuid })
  }

  render() {
    if (!this.renderer || !this.buffer) return

    this.renderer.setRenderTarget(this.buffer)
    this.renderer.clear()

    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)
  }
}
