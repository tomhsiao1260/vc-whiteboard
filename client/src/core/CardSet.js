import * as THREE from 'three'
import Card from './core/Card'
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

  create(segmentID, dom, mouse, center) {
    const info = { w: 1, h: 1 }
    if (segmentID === '20230522181603') { info.w = 1.5; info.h = 1 }
    if (segmentID === '20230509182749') { info.w = 1.5; info.h = 1 }
    if (segmentID === '20230702185752') { info.w = 1.5; info.h = 1 }

    const viewer = new Card({
      info,
      canvas: dom,
      renderer: this.renderer,
      time: this.time,
      app: this.app,
    })

    viewer.controls.addEventListener('change', () => {
      this.render()
      this.time.trigger('tick')
    })

    const geometry = new THREE.PlaneGeometry(info.w, info.h)
    const material = new CopyShader()
    material.uniforms.tDiffuse.value = viewer.buffer.texture

    const card = new THREE.Mesh(geometry, material)
    card.position.copy(center)
    card.userData = { center, segmentID, viewer, dom, w: info.w, h: info.h }

    viewer.create(segmentID, card.uuid)
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
