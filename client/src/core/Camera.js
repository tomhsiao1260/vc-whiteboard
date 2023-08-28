import * as THREE from 'three'
import { MOUSE, TOUCH } from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MapControls } from 'three/addons/controls/MapControls.js'

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
    const { width, height } = this.sizes.viewport
    this.instance = new THREE.PerspectiveCamera(75, width / height, 0.1, 100)
    this.instance.up.set(0, 0, 1)
    this.instance.position.z = 2
    this.container.add(this.instance)

    this.sizes.on('resize', () => {
      const { width, height } = this.sizes.viewport
      this.instance.aspect = width / height
      this.instance.updateProjectionMatrix()
    })
  }

  setOrbitControls() {
    this.controls = new MapControls(this.instance, this.renderer.domElement)
    this.controls.enableDamping = false

    this.controls.addEventListener('change', () => this.time.trigger('tick'))
  }
}
