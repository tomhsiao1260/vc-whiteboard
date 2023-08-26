import * as THREE from 'three'
import { MOUSE, TOUCH } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Card from './Card'

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
controls.addEventListener('change', renderWhiteBoard)

const whiteBoard = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 'gray' }))
scene.add(whiteBoard)
whiteBoard.position.set(0, 0, -0.2)

function renderWhiteBoard() {
  renderer.setRenderTarget(null)
  renderer.render(scene, camera)
}
renderWhiteBoard()

let spacePress = false
window.addEventListener('keydown', (e) => { spacePress = (e.code == 'Space') })
window.addEventListener('keyup', (e) => { spacePress = !(e.code == 'Space') })

let mousePress = false
window.addEventListener('mousedown', (e) => { mousePress = true })
window.addEventListener('mouseup', (e) => { mousePress = false })

const cards = new Card({ whiteBoard, camera })

window.addEventListener('mousedown', (e) => {
  if (!spacePress) return 

  const x = e.clientX / window.innerWidth * 2 - 1
  const y = - (e.clientY / window.innerHeight) * 2 + 1
  const card = cards.create('segment', x, y)
  scene.add(card)

  renderWhiteBoard()
})

