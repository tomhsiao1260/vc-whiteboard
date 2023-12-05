import * as THREE from 'three'
import { MOUSE, TOUCH } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Camera {
  constructor(_option) {
    this.time = _option.time
    this.sizes = _option.sizes
    this.renderer = _option.renderer

    this.container = new THREE.Object3D()
    this.container.matrixAutoUpdate = false

    this.setInstance()
    this.setOrbitControls()
  }

  setInstance() {
    const scope = 1.5
    const { width, height } = this.sizes.viewport
    this.instance = new THREE.OrthographicCamera(-scope * width / height, scope * width / height, scope, -scope, 0.1, 100)
    this.instance.position.z = 2
    this.container.add(this.instance)

    this.sizes.on('resize', () => {
      const { width, height } = this.sizes.viewport
      this.instance.aspect = width / height
      this.instance.updateProjectionMatrix()
    })
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.instance, this.renderer.domElement)
    this.controls.enableDamping = false
    this.controls.screenSpacePanning = true // pan orthogonal to world-space direction camera.up
    this.controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }
    // this.controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }
    this.controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.PAN }
    // this.controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN }

    this.controls.addEventListener('change', () => this.time.trigger('tick'))
  }
}
