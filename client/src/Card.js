import * as THREE from 'three'
import Loader from './Loader'
import ViewerCore from './core/ViewerCore'
import { CopyShader } from './core/CopyShader'

export default class Card {
  constructor(_option) {
    this.viewer = null
    this.canvas = null
    this.card = null
    this.camera = _option.camera
    this.renderer = _option.renderer
    this.whiteBoard = _option.whiteBoard
    this.list = []

    this.setup()
  }

  async setup() {
    const canvas = document.createElement('div')
    canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.0)'
    canvas.style.border = '1px solid white'
    canvas.style.display = 'inline'
    canvas.style.position = 'absolute'
    document.body.appendChild(canvas)

    const volumeMeta = await Loader.getVolumeMeta()
    const segmentMeta = await Loader.getSegmentMeta()
    const data = { volumeMeta, segmentMeta, size: { w: 500, h: 500 } }
    const renderer = this.renderer

    this.viewer = new ViewerCore({ data, renderer, canvas })
    this.canvas = canvas
  }

  async create(mode, x, y) {
    const canvas = this.canvas
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

    material.uniforms.tDiffuse.value = this.viewer.buffer[ mode ].texture
    card.userData = { mode, center, canvas, w: 1, h: 1 }
    card.position.copy(center)
    this.list.push(card)

    this.viewer.params.mode = mode
    await this.updateViewer(this.viewer)
    this.viewer.render()

    return card
  }

  updateCanvas(card) {
    const { center, canvas, w, h } = card.userData

    const bl = new THREE.Vector3(center.x - w / 2, center.y - h / 2, 0)
    const tr = new THREE.Vector3(center.x + w / 2, center.y + h / 2, 0)
    // bottom-left (-1, -1) top-right (1, 1)
    const pbl = bl.clone().project(this.camera)
    const ptr = tr.clone().project(this.camera)

    canvas.style.left = `${ (pbl.x + 1) * window.innerWidth * 0.5 }px`
    canvas.style.bottom = `${ (pbl.y + 1) * window.innerHeight * 0.5 }px`
    canvas.style.width = `${ (ptr.x - pbl.x) * window.innerWidth * 0.5 }px`
    canvas.style.height = `${ (ptr.y - pbl.y) * window.innerHeight * 0.5 }px`
    canvas.style.display = 'inline'

    this.canvas = canvas
  }

  hideCanvas() {
    this.canvas.style.display = 'none'
  }

  render(card) {
    const { mode } = card.userData

    this.viewer.params.mode = mode
    this.viewer.render()
  }

  async updateViewer(viewer) {
    const { mode } = viewer.params
    if (mode === 'segment') { await this.modeA(viewer) }
    if (mode === 'volume') { await this.modeB(viewer) }
    if (mode === 'volume-segment') { await this.modeC(viewer) }
    if (mode === 'layer') { await this.modeC(viewer) }
    if (mode === 'grid layer') { await this.modeC(viewer) }
  }

  // segment mode
  async modeA(viewer) {
    viewer.clear()
    const segment = viewer.updateSegment()
    await segment.then(() => { console.log(`segment ${viewer.params.layers.select} is loaded`) })
  }

  // volume mode
  async modeB(viewer) {
    viewer.clear()
    const volume = viewer.updateVolume()
    await volume.then(() => { console.log(`volume ${viewer.params.layers.select} is loaded`) })
  }

  // volume-segment mode
  async modeC(viewer) {
    viewer.clear()
    const volume = viewer.updateVolume()
    const segment = viewer.updateSegment()

    await Promise.all([volume, segment])
      .then(() => viewer.clipSegment())
      .then(() => viewer.updateSegmentSDF())
      .then(() => { console.log(`volume-segment ${viewer.params.layers.select} is loaded`) })
  }
}

