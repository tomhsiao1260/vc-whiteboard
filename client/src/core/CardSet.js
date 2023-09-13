import * as THREE from 'three'
import CardA from './core/CardA'
import { CopyShader } from './core/CopyShader'

export default class CardSet {
  constructor(_option) {
    this.time = _option.time
    this.sizes = _option.sizes
    this.camera = _option.camera
    this.renderer = _option.renderer

    this.list = []
    this.targetCard = null
  }

  create(mode, dom, mouse, center) {
    let id = null
    if (mode === 'cardA') id = '20230503225234'
    if (mode === 'cardB') id = '20230504093154'
    const viewer = new CardA({ renderer: this.renderer, canvas: dom, id })

    viewer.controls.addEventListener('change', () => {
      this.render()
      this.time.trigger('tick')
    })

    const geometry = new THREE.PlaneGeometry(1, 1)
    const material = new CopyShader()
    material.uniforms.tDiffuse.value = viewer.buffer.texture

    const card = new THREE.Mesh(geometry, material)
    card.position.copy(center)
    card.userData = { center, mode, viewer, dom, w: 1, h: 1 }

    viewer.render()
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
