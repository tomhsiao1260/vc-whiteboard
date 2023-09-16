import * as THREE from 'three'
// import { TIFFLoader } from 'three/addons/loaders/TIFFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default class Card {
  constructor(_option) {
    this.scene = null
    this.camera = null
    this.controls = null
    this.renderer = null
    this.segmentID = null

    this.time = _option.time
    this.app = _option.app
    this.canvas = _option.canvas
    this.renderer = _option.renderer
    this.width = _option.info.w * 500
    this.height = _option.info.h * 500
    this.buffer = new THREE.WebGLRenderTarget(this.width, this.height)

    this.init()
  }

  init() {
    // scene setup
    this.scene = new THREE.Scene()

    // camera setup
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 50)
    this.camera.position.copy(new THREE.Vector3(0.4, -0.4, -1.0).multiplyScalar(2.0))
    this.camera.up.set(0, -1, 0)
    this.camera.far = 5
    this.camera.updateProjectionMatrix()

    // camera controls
    this.controls = new OrbitControls(this.camera, this.canvas)
  }

  async create(segmentID, uuid) {
    // await const texture = new TIFFLoader().loadAsync('20230522181603.tif')
    console.log(segmentID)

    let mesh = null
    if (segmentID === '20230522181603') mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial())
    if (segmentID === '20230509182749') mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 5, 5), new THREE.MeshNormalMaterial())
    if (segmentID === '20230702185752') mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 5, 5), new THREE.MeshBasicMaterial())
    this.scene.add(mesh)

    this.segmentID = segmentID

    window.setTimeout(() => {
      this.render()
      this.time.trigger('tick')
      this.app.API.cardLoad(uuid)
    }, 1000)
  }

  render() {
    if (!this.renderer) return

    this.renderer.setRenderTarget(this.buffer)
    this.renderer.clear()

    this.renderer.render(this.scene, this.camera)
    this.renderer.setRenderTarget(null)
  }
}
