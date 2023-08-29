import * as THREE from 'three'
import Loader from './Loader'
import ViewerCoreWrap from './core/ViewerCoreWrap'
import { CopyShader } from './core/CopyShader'

export default class CardUnwrap {
  constructor(_option) {
    this.time = _option.time
    this.sizes = _option.sizes
    this.camera = _option.camera
    this.renderer = _option.renderer

    this.list = []
    this.focusCard = null
    this.$card = document.createElement('div')

    this.setup()
  }

  setup() {
    this.$card.className = 'cardDOM'
    this.$card.style.backgroundColor = 'rgba(0, 0, 0, 0.0)'
    this.$card.style.border = '1px solid white'
    this.$card.style.display = 'none'
    this.$card.style.position = 'absolute'
    document.body.appendChild(this.$card)
  }

  async setViewer() {
    const { width, height } = this.sizes.viewport
    const volumeMeta = await Loader.getVolumeMeta()
    const segmentMeta = await Loader.getSegmentMeta()
    const data = { volumeMeta, segmentMeta, size: { w: 500, h: 500 *  height / width } }
    this.viewer = new ViewerCoreWrap({ data, renderer: this.renderer, canvas: this.$card })
  }

  setLoadingText(mouse) {
    const loadingDIV = document.createElement('div')
    loadingDIV.className = 'loadingCard'
    loadingDIV.innerText = 'Loading ...'
    loadingDIV.style.left = `${100 * (1 + mouse.x) / 2}%`
    loadingDIV.style.top = `${100 * (1 - mouse.y) / 2}%`
    loadingDIV.style.display = 'inline'
    document.body.appendChild(loadingDIV)

    return loadingDIV
  }

  updateCanvas(card) {
    if (!card) return

    const { width, height } = this.sizes.viewport
    const { center, canvas, w, h } = card.userData

    const bl = new THREE.Vector3(center.x - w / 2, center.y - h / 2, 0)
    const tr = new THREE.Vector3(center.x + w / 2, center.y + h / 2, 0)
    // bottom-left (-1, -1) top-right (1, 1)
    const pbl = bl.clone().project(this.camera.instance)
    const ptr = tr.clone().project(this.camera.instance)

    this.$card.style.left = `${ (pbl.x + 1) * width * 0.5 }px`
    this.$card.style.bottom = `${ (pbl.y + 1) * height * 0.5 }px`
    this.$card.style.width = `${ (ptr.x - pbl.x) * width * 0.5 }px`
    this.$card.style.height = `${ (ptr.y - pbl.y) * height * 0.5 }px`
    this.$card.style.display = 'inline'
  }

  hideCanvas() {
    this.$card.style.display = 'none'
  }

  create(mode, mouse, center) {
    const { width, height } = this.sizes.viewport
    const canvas = this.$card
    const geometry = new THREE.PlaneGeometry(2, 1)
    const material = new CopyShader()
    const card = new THREE.Mesh(geometry, material)

    material.uniforms.tDiffuse.value = this.viewer.buffer[ mode ].texture
    card.userData = { mode, center, canvas, w: 2, h: 1 }
    card.position.copy(center)
    this.focusCard = card
    this.list.push(card)

    this.viewer.params.mode = mode
    this.updateViewer(this.viewer, mouse)

    return card
  }

  async updateViewer(viewer, mouse) {
    const { mode } = viewer.params
    const loadingDIV = this.setLoadingText(new THREE.Vector2())

    await this.modeA(viewer)

    this.viewer.render()
    this.time.trigger('tick')
    loadingDIV.style.display = 'none'
  }

  updateAllBuffer() {
    this.viewer.params.mode = 'segment'
    this.viewer.render()

    this.time.trigger('tick')
  }

  // segment mode
  async modeA(viewer) {
    viewer.clear()
    const segment = await viewer.updateSegment()
    // await segment.then(() => { console.log(`segment ${viewer.params.layers.select} is loaded`) })
  }
}
