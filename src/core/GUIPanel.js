import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

export default class GUIPanel {
  constructor(_option) {
    this.mode = _option.mode
    this.cardSet = _option.cardSet
    this.cardUnwrap = _option.cardUnwrap

    this.cardMode = null
    this.onCard = false
    this.gui = new GUI()
    this.gui.add(this, 'mode', ['segment', 'layer', 'volume', 'volume-segment'])
    this.gui.add(this.cardUnwrap.viewer.params, 'flatten', 0.0, 1.0).onChange(() => this.cardUnwrap.updateAllBuffer())
  }

  currentCard() {
    if (this.onCard && this.cardSet.focusCard.userData.mode == this.cardMode) return
    this.cardMode = this.cardSet.focusCard.userData.mode
    this.onCard = true
    this.reset()

    const mode = this.cardMode
    const viewer = this.cardSet.viewer

    if (mode === 'segment') {
      const id = viewer.params.layers.select
      const clip = viewer.volumeMeta.nrrd[id].clip
      this.gui.add(viewer.params, 'alpha', 0.0, 1.0).onChange(() => this.cardSet.updateAllBuffer())
      this.gui.add(viewer.params, 'layer', clip.z, clip.z + clip.d, 1).onChange(() => this.cardSet.updateAllBuffer())
    }
    if (mode === 'volume') { return }
    if (mode === 'volume-segment') {
      this.gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(() => this.cardSet.updateAllBuffer())
    }
    if (mode === 'layer') {
      const id = viewer.params.layers.select
      const clip = viewer.volumeMeta.nrrd[id].clip

      viewer.params.layer = clip.z
      this.gui.add(viewer.params, 'inverse').onChange(() => this.cardSet.updateAllBuffer())
      this.gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(() => this.cardSet.updateAllBuffer())
      this.gui.add(viewer.params, 'layer', clip.z, clip.z + clip.d, 1).onChange(() => this.cardSet.updateAllBuffer())
    }
  }

  newCard() {
    if (!this.onCard) return
    this.onCard = false

    this.reset()
    this.gui.add(this, 'mode', ['segment', 'layer', 'volume', 'volume-segment'])
  }

  reset() {
    if (this.gui) { this.gui.destroy() }
    this.gui = new GUI()
  }
}
