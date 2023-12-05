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
    // create a full screen texture image for rendering
    const blobUrl = URL.createObjectURL(blob)
    const texture = await new TextureLoader().loadAsync(blobUrl)
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter

    const material = new ImageShader()
    material.uniforms.tDiffuse.value = texture

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 1, 1), material)
    this.scene.add(mesh)

    // change card size via texture w, h info
    const tWidth = texture.image.width
    const tHeight = texture.image.height
    const lMax = Math.max(tWidth, tHeight)
    const s = (lMax < 10000) ? 1 : 10000 / lMax

    this.width = tWidth * s
    this.height = tHeight * s
    this.buffer = new THREE.WebGLRenderTarget(this.width, this.height)

    const size = 2
    const fw = (lMax === tWidth) ? 1 : tWidth / lMax
    const fh = (lMax === tHeight) ? 1 : tHeight / lMax

    card.userData.wo = size *  fw
    card.userData.ho = size * fh

    card.userData.w = card.userData.wo
    card.userData.h = card.userData.ho
    card.scale.x = card.userData.wo
    card.scale.y = card.userData.ho
    card.material.uniforms.tDiffuse.value = this.buffer.texture

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
