import * as THREE from 'three'
import { MOUSE, TOUCH } from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import Loader from './Loader'
import ViewerCore from './core/ViewerCore'
import { CopyShader } from './core/CopyShader'

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

const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 'gray' }))
scene.add(ground)
ground.position.set(0, 0, -0.2)

const bufferMap = {}
bufferMap['segment'] = new THREE.WebGLRenderTarget(500, 500)
bufferMap['layer'] = new THREE.WebGLRenderTarget(500, 500)

const mode = 'segment'
const center = new THREE.Vector3()
const w = 1
const h = 1
const cardMaterial = new CopyShader()
const cardGeometry = new THREE.PlaneGeometry(w, h)
const card = new THREE.Mesh(cardGeometry, cardMaterial)
cardMaterial.uniforms.tDiffuse.value = bufferMap['segment'].texture
card.userData = { mode, center, w, h }
card.position.copy(center)
scene.add(card)

window.addEventListener('resize', () =>
{
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
})

function updateBuffer(viewer) {
  const modeOrigin = viewer.params.mode

  viewer.params.mode = 'segment'
  renderer.setRenderTarget(bufferMap['segment'])
  renderer.clear()
  viewer.render()
  renderer.setRenderTarget(null)
  renderer.render(scene, camera)

  viewer.params.mode = modeOrigin
}

init()

async function init() {
  const volumeMeta = await Loader.getVolumeMeta()
  const segmentMeta = await Loader.getSegmentMeta()
  const data = { volumeMeta, segmentMeta }

  const viewer = new ViewerCore({ data, renderer })

  loading()
  update(viewer)
  labeling(viewer)
  // snapshot(viewer, 'segment')
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
  
  updateBuffer(viewer)
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
    gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(() => updateBuffer(viewer))
  }
  if (mode === 'layer') {
    const id = viewer.params.layers.select
    const clip = viewer.volumeMeta.nrrd[id].clip

    viewer.params.layer = clip.z
    gui.add(viewer.params, 'inverse').onChange(() => updateBuffer(viewer))
    gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(() => updateBuffer(viewer))
    gui.add(viewer.params, 'layer', clip.z, clip.z + clip.d, 1).onChange(() => updateBuffer(viewer))
  }
  if (mode === 'grid layer') {
    gui.add(viewer.params, 'inverse').onChange(() => updateBuffer(viewer))
    gui.add(viewer.params, 'surface', 0.001, 0.5).onChange(() => updateBuffer(viewer))
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

