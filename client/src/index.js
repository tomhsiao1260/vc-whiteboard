import * as THREE from 'three'
import { MOUSE, TOUCH } from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import Loader from './Loader'
import ViewerCore from './core/ViewerCore'
import { CopyShader } from './core/CopyShader'

let viewer

const dom = document.createElement('div')
dom.style.backgroundColor = 'rgba(255, 0, 0, 1.0)'
// dom.style.backgroundColor = 'rgba(0, 0, 0, 0.0)'
dom.style.border = '1px solid white'
dom.style.display = 'inline'
dom.style.position = 'absolute'
document.body.appendChild(dom)

// Scene
const scene = new THREE.Scene()

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.z = 3
scene.add(camera)

// Renderer
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0, 0)
renderer.outputColorSpace = THREE.SRGBColorSpace

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target = new THREE.Vector3(0,0,0)
controls.enableDamping = false
controls.screenSpacePanning = true // pan orthogonal to world-space direction camera.up
controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }
controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE }
controls.addEventListener('change', renderMap)

init()

async function init() {
  const volumeMeta = await Loader.getVolumeMeta()
  const segmentMeta = await Loader.getSegmentMeta()
  const data = { volumeMeta, segmentMeta }

  viewer = new ViewerCore({ data, renderer, canvas: dom })

  loading()
  update(viewer)
  // labeling(viewer)
  // snapshot(viewer, 'segment')

  viewer.controls.addEventListener('change', () => renderCard(viewer))
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 'gray' }))
scene.add(ground)
ground.position.set(0, 0, -0.2)
const meshes = [ ground ]

const bufferMap = {}
bufferMap['segment'] = new THREE.WebGLRenderTarget(500, 500)
bufferMap['volume'] = new THREE.WebGLRenderTarget(500, 500)
bufferMap['layer'] = new THREE.WebGLRenderTarget(500, 500)

window.addEventListener('resize', () =>
{
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
})

let spacePress = false
window.addEventListener('keydown', (e) => { spacePress = (e.code == 'Space') })
window.addEventListener('keyup', (e) => { spacePress = !(e.code == 'Space') })

let mousePress = false
window.addEventListener('mousedown', (e) => { mousePress = true })
window.addEventListener('mouseup', (e) => { mousePress = false })

const mouse = new THREE.Vector2()
const raycaster = new THREE.Raycaster()
window.addEventListener('mousedown', (e) => {
    mouse.x = e.clientX / window.innerWidth * 2 - 1
    mouse.y = - (e.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects( meshes )
    if (!intersects.length) return
    if (spacePress) {
      const cardMaterial = new CopyShader()
      const { mode } = viewer.params
      if (mode === 'segment') { cardMaterial.uniforms.tDiffuse.value = bufferMap['segment'].texture }
      if (mode === 'volume') { cardMaterial.uniforms.tDiffuse.value = bufferMap['volume'].texture }
      if (mode === 'layer') { cardMaterial.uniforms.tDiffuse.value = bufferMap['layer'].texture }

      const w = 1
      const h = 1
      const pos = intersects[0].point
      const center = new THREE.Vector3(pos.x, pos.y, 0)
      const cardGeometry = new THREE.PlaneGeometry(w, h)
      const card = new THREE.Mesh(cardGeometry, cardMaterial)
      card.userData = { mode, center, w, h }
      card.position.copy(center)
      scene.add(card)
      meshes.push(card)

      renderCard(viewer)
      return
    }
    if (!intersects[0].object.userData.mode) {
      dom.style.display = 'none'
      return
    }
})

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX / window.innerWidth * 2 - 1
  mouse.y = - (e.clientY / window.innerHeight) * 2 + 1

  controls.enablePan = true
  document.body.style.cursor = 'auto'

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects( meshes )
  if (intersects.length && intersects[0].object.userData.mode) {
    controls.enablePan = false
    document.body.style.cursor = 'pointer'

    const { center, w, h } = intersects[0].object.userData
    const bl = new THREE.Vector3(center.x - w / 2, center.y - h / 2, 0)
    const tr = new THREE.Vector3(center.x + w / 2, center.y + h / 2, 0)
    // bottom-left (-1, -1) top-right (1, 1)
    const pbl = bl.clone().project(camera)
    const ptr = tr.clone().project(camera)
    dom.style.left = `${ (pbl.x + 1) * window.innerWidth * 0.5 }px`
    dom.style.bottom = `${ (pbl.y + 1) * window.innerHeight * 0.5 }px`
    dom.style.width = `${ (ptr.x - pbl.x) * window.innerWidth * 0.5 }px`
    dom.style.height = `${ (ptr.y - pbl.y) * window.innerHeight * 0.5 }px`
    dom.style.display = 'inline'

    if (mousePress) { renderCard(viewer) }
  }
})

function renderCard(viewer) {
  const modeOrigin = viewer.params.mode

  viewer.params.mode = 'segment'
  renderer.setRenderTarget(bufferMap['segment'])
  renderer.clear()
  viewer.render()
  viewer.params.mode = 'layer'
  renderer.setRenderTarget(bufferMap['layer'])
  renderer.clear()
  viewer.render()
  viewer.params.mode = 'volume'
  renderer.setRenderTarget(bufferMap['volume'])
  renderer.clear()
  viewer.render()
  renderer.setRenderTarget(null)
  renderMap()

  viewer.params.mode = modeOrigin
}

function renderMap() {
  renderer.setRenderTarget(null)
  renderer.render(scene, camera)
}

function update(viewer) {
  updateViewer(viewer)
  updateGUI(viewer)
}

async function updateViewer(viewer) {
  const loadingDiv = document.querySelector('#loading')
  if (loadingDiv) loadingDiv.style.display = 'inline'

  const { mode } = viewer.params
  if (mode === 'segment') { await modeA(viewer) }
  if (mode === 'volume') { await modeB(viewer) }
  if (mode === 'volume-segment') { await modeC(viewer) }
  if (mode === 'layer') { await modeC(viewer) }
  if (mode === 'grid layer') { await modeC(viewer) }

  renderCard(viewer)
  if (loadingDiv) loadingDiv.style.display = 'none'
}

let gui

function updateGUI(viewer) {
  const { mode } = viewer.params

  if (gui) { gui.destroy() }
  gui = new GUI()
  gui.add(viewer.params, 'mode', ['segment', 'layer', 'grid layer', 'volume', 'volume-segment']).onChange(() => update(viewer))
  gui.add(viewer.params.layers, 'select', viewer.params.layers.options).name('layers').onChange(() => update(viewer))

  if (mode === 'segment') { return }
  if (mode === 'volume') { return }
  if (mode === 'volume-segment') {
    gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(() => renderCard(viewer))
  }
  if (mode === 'layer') {
    const id = viewer.params.layers.select
    const clip = viewer.volumeMeta.nrrd[id].clip

    viewer.params.layer = clip.z
    gui.add(viewer.params, 'inverse').onChange(() => renderCard(viewer))
    gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(() => renderCard(viewer))
    gui.add(viewer.params, 'layer', clip.z, clip.z + clip.d, 1).onChange(() => renderCard(viewer))
  }
  if (mode === 'grid layer') {
    gui.add(viewer.params, 'inverse').onChange(() => renderCard(viewer))
    gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(() => renderCard(viewer))
  }
}

// segment mode
async function modeA(viewer) {
  viewer.clear()
  const segment = viewer.updateSegment()
  await segment.then(() => { console.log(`segment ${viewer.params.layers.select} is loaded`) })
}

// volume mode
async function modeB(viewer) {
  viewer.clear()
  const volume = viewer.updateVolume()
  await volume.then(() => { console.log(`volume ${viewer.params.layers.select} is loaded`) })
}

// volume-segment mode
async function modeC(viewer) {
  viewer.clear()
  const volume = viewer.updateVolume()
  const segment = viewer.updateSegment()

  await Promise.all([volume, segment])
    .then(() => viewer.clipSegment())
    .then(() => viewer.updateSegmentSDF())
    .then(() => { console.log(`volume-segment ${viewer.params.layers.select} is loaded`) })
}

// loading div element
function loading() {
  const loadingDiv = document.createElement('div')
  loadingDiv.id = 'loading'
  loadingDiv.innerHTML = 'Loading ...'
  document.body.appendChild(loadingDiv)
}

// segment labeling
function labeling(viewer) {
  const mouse = new THREE.Vector2()
  const labelDiv = document.createElement('div')
  labelDiv.id = 'label'
  document.body.appendChild(labelDiv)

  window.addEventListener('mousedown', (e) => {
    if (!(e.target instanceof HTMLCanvasElement)) return
    mouse.x = e.clientX / window.innerWidth * 2 - 1
    mouse.y = - (e.clientY / window.innerHeight) * 2 + 1

    const { mode } = viewer.params
    labelDiv.style.display = 'none'

    const loadingDiv = document.querySelector('#loading')
    if (loadingDiv.style.display === 'inline') return

    if (mode === 'segment' || mode === 'layer') {
      // only this line is important
      const sTarget = viewer.getLabel(mouse)
      if (!sTarget) { return }

      const { id, clip } = sTarget
      labelDiv.style.display = 'inline'
      labelDiv.style.left = (e.clientX + 20) + 'px'
      labelDiv.style.top = (e.clientY + 20) + 'px'
      labelDiv.innerHTML = `${id}<br>layer: ${clip.z}~${clip.z+clip.d}`
      // as well as this line
      updateViewer(viewer)
    }
  })
}

async function snapshot(viewer, mode) {
  const { options } = viewer.params.layers

  for (const key in options) {
    const vID = options[key]
    const { clip } = viewer.volumeMeta.nrrd[vID]
    const filename = `${mode}-${clip.z}-${clip.d}`
    // comment out this line to snapshot all
    if (vID > 2) break;
    await snapshotOnce(viewer, mode, vID, filename)
    await new Promise((res) => setTimeout(res, 100))
  }
}

async function snapshotOnce(viewer, mode, vID, filename) {
  viewer.params.mode = mode
  viewer.params.layers.select = vID
  await updateViewer(viewer)
  if (!viewer.renderer) return

  const imgData = viewer.renderer.domElement.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = imgData
  link.download = filename
  link.click()
}

