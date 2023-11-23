import * as THREE from 'three'
import Card from './core/Card'
import Hint from './core/Hint'
import { CopyShader } from './core/CopyShader'

export default class CardSet {
  constructor(_option) {
    this.app = _option.app
    this.time = _option.time
    this.sizes = _option.sizes
    this.camera = _option.camera
    this.renderer = _option.renderer

    this.list = []
    this.targetCard = null
  }

  create(name, dom, mouse, center) {
    const info = {}
    if (name === '20230522181603') { info.w = 2912; info.h = 1060; }
    if (name === '20230509182749') { info.w = 3278; info.h = 1090; }
    if (name === '20230702185752') { info.w = 1746; info.h = 1726; }
    if (name === ' ') { info.w = 1190 * 3; info.h = 1018 * 3; }

    let viewer
    if (name === ' ') {
      viewer = new Hint({
        info,
        canvas: dom,
        renderer: this.renderer,
        time: this.time,
        app: this.app,
      })
    } else {
      viewer = new Card({
        info,
        canvas: dom,
        renderer: this.renderer,
        time: this.time,
        app: this.app,
      })
    }

    viewer.controls.addEventListener('change', () => {
      this.render()
      this.time.trigger('tick')
    })

    const w = parseFloat((info.w / 1500).toFixed(2))
    const h = parseFloat((info.h / 1500).toFixed(2))

    const geometry = new THREE.PlaneGeometry(w, h)
    const material = new CopyShader()
    material.uniforms.tDiffuse.value = viewer.buffer.texture

    const card = new THREE.Mesh(geometry, material)
    const id = card.uuid
    const type = 'card'
    card.position.copy(center)
    card.userData = { id, name, type, center, w, h, viewer, dom }

    viewer.create(name, id, info)
    this.list.push(card)

    return card
  }

  createIframe(id, center, width, height) {
    const geometry = new THREE.PlaneGeometry(width, height)
    const material = new THREE.MeshBasicMaterial()

    const name = ''
    const type = 'iframe'

    const card = new THREE.Mesh(geometry, material)
    card.position.copy(center)
    card.userData = { id, name, type, center, w: width, h: height, viewer: null, dom: null }
    this.list.push(card)

    return card
  }

  updateCanvas(card) {
    if (!card) return

    const { center, dom, w, h } = card.userData

    const bl = new THREE.Vector3(center.x - w / 2, center.y - h / 2, 0)
    const tr = new THREE.Vector3(center.x + w / 2, center.y + h / 2, 0)
    // bottom-left (-1, -1) top-right (1, 1)
    const pbl = bl.clone().project(this.camera.instance)
    const ptr = tr.clone().project(this.camera.instance)

    return [ pbl, ptr ]
  }

  render() {
    if (!this.targetCard) return

    const { viewer } = this.targetCard.userData
    viewer.render()
  }
}
