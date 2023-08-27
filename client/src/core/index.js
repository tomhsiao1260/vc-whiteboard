import * as THREE from "three";
import { MOUSE, TOUCH } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Card from "./Card";

export default class VolumeViewer {
  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  // Renderer
  canvas = document.querySelector(".webgl");
  renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });

  // Controls
  controls = new OrbitControls(this.camera, this.canvas);

  whiteBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 15),
    new THREE.MeshBasicMaterial({ color: "#262626" })
  );

  constructor() {
    this.camera.position.z = 2;
    this.scene.add(this.camera);

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls.target = new THREE.Vector3(0, 0, 0);
    this.controls.enableDamping = false;
    this.controls.screenSpacePanning = true; // pan orthogonal to world-space direction camera.up
    this.controls.mouseButtons = {
      LEFT: MOUSE.PAN,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.ROTATE,
    };
    this.controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE };
    this.controls.addEventListener("change", this.renderWhiteBoard);

    this.scene.add(this.whiteBoard);
    this.whiteBoard.position.set(0, 0, -0.2);

    let spacePress = false;
    window.addEventListener("keydown", (e) => {
      spacePress = e.code == "Space";
    });
    window.addEventListener("keyup", (e) => {
      spacePress = !(e.code == "Space");
    });

    let mousePress = false;
    window.addEventListener("mousedown", (e) => {
      mousePress = true;
    });
    window.addEventListener("mouseup", (e) => {
      mousePress = false;
    });

    const cardInstance = new Card({
      whiteBoard: this.whiteBoard,
      renderer: this.renderer,
      camera: this.camera,
    });

    // cardInstance.viewer.controls.addEventListener('change', () => {
    //   cardInstance.render(cardInstance.card)
    //   renderWhiteBoard()
    // })

    window.addEventListener("mousedown", async (e) => {
      if (!spacePress) return;

      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      const card = await cardInstance.create("segment", x, y);
      this.scene.add(card);

      renderWhiteBoard();
    });

    window.addEventListener("mousedown", (e) => {
      if (spacePress) return;

      const mouse = new THREE.Vector2();
      const raycaster = new THREE.Raycaster();
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(cardInstance.list);
      if (!intersects.length) cardInstance.hideCanvas();
    });

    window.addEventListener("mousemove", (e) => {
      this.controls.enablePan = true;
      document.body.style.cursor = "auto";

      const mouse = new THREE.Vector2();
      const raycaster = new THREE.Raycaster();
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(cardInstance.list);
      if (!intersects.length) return;

      this.controls.enablePan = false;
      document.body.style.cursor = "pointer";

      const card = intersects[0].object;
      cardInstance.card = card;
      cardInstance.updateCanvas(card);
      cardInstance.render(card);
      this.renderWhiteBoard();
    });

    this.renderWhiteBoard();
  }

  renderWhiteBoard() {
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
}
