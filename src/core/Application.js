import * as THREE from "three";

import Time from "./utils/Time";
import Sizes from "./utils/Sizes";

import Camera from "./Camera";
import World from "./World";

export default class Application {
  constructor(_options) {
    this.$canvas = _options.$canvas;

    this.time = new Time();
    this.sizes = new Sizes();

    this.setRenderer();
    this.setCamera();
    this.setWorld();
  }

  API = {
    on: (eventName, cb) => {
      this.API[eventName] = cb;
    },
  };

  setRenderer() {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.$canvas,
    });

    const { width, height } = this.sizes.viewport;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.sizes.on("resize", () => {
      const { width, height } = this.sizes.viewport;
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  setCamera() {
    this.camera = new Camera({
      time: this.time,
      sizes: this.sizes,
      renderer: this.renderer,
    });

    this.scene.add(this.camera.container);

    this.time.on("tick", () => {
      this.renderer.render(this.scene, this.camera.instance);
      // console.log('render')
    });
  }

  setWorld() {
    this.world = new World({
      app: this,
      time: this.time,
      sizes: this.sizes,
      camera: this.camera,
      renderer: this.renderer,
    });
    this.scene.add(this.world.container);

    // render once
    this.renderer.render(this.scene, this.camera.instance);
  }
}
