import * as THREE from 'three'

export default class WhiteBoard {
  constructor(_option) {
    this.container = new THREE.Object3D();
    this.container.matrixAutoUpdate = false;

    this.setWhiteBoard()
  }

  setWhiteBoard() {
    const geometry = new THREE.PlaneGeometry(30, 15)
    const material = new THREE.MeshBasicMaterial({ color: '#262626' })
    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.set(0, 0, -0.2)
    this.container.add(mesh)
  }
}
