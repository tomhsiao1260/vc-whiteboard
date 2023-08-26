import * as THREE from 'three'
import { CopyShader } from './core/CopyShader'

export default class Card {
  constructor(_option) {
    this.whiteBoard = _option.whiteBoard
    this.camera = _option.camera

    this.setCard()
  }

  setCard() {
    this.bufferMap = {}
    this.bufferMap['segment'] = new THREE.WebGLRenderTarget(500, 500)
    this.bufferMap['volume'] = new THREE.WebGLRenderTarget(500, 500)
    this.bufferMap['layer'] = new THREE.WebGLRenderTarget(500, 500)
  }

  create(mode, x, y) {
    const mouse = new THREE.Vector2(x, y)
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, this.camera)

    const intersects = raycaster.intersectObjects([ this.whiteBoard ])
    if (!intersects.length) return

    const position = intersects[0].point
    const center = new THREE.Vector3(position.x, position.y, 0)

    const geometry = new THREE.PlaneGeometry(1, 1)
    const material = new CopyShader()
    const card = new THREE.Mesh(geometry, material)

    material.uniforms.tDiffuse.value = this.bufferMap[ mode ].texture
    card.userData = { mode, center, w: 1, h: 1 }
    card.position.copy(center)

    return card
  }
}
