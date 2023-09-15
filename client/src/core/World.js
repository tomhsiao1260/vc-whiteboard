import * as THREE from "three";
import { nanoid } from "nanoid";

import WhiteBoard from "./WhiteBoard";
import CardSet from "./CardSet";
// import GUIPanel from './GUIPanel'
import Controls from "./Controls";
import Application from "./Application";

export default class World {
  constructor(_option) {
    this.app = _option.app;
    this.time = _option.time;
    this.sizes = _option.sizes;
    this.camera = _option.camera;
    this.renderer = _option.renderer;

    this.container = new THREE.Object3D();
    this.container.matrixAutoUpdate = false;

    this.start();
  }

  start() {
    this.setControls();
    this.setWhiteBoard();
    this.setCard();
  }

  setControls() {
    this.controls = new Controls({
      time: this.time,
      sizes: this.sizes,
      camera: this.camera,
    });
  }

  setWhiteBoard() {
    this.whiteBoard = new WhiteBoard({});
    this.container.add(this.whiteBoard.container);

    this.time.trigger("tick");
  }

  setCard() {
    this.cardSet = new CardSet({
      time: this.time,
      sizes: this.sizes,
      camera: this.camera,
      renderer: this.renderer,
    });

    // generate a card when clicking
    this.time.on("mouseDown", () => {
      let mode;
      if (this.controls.numKeyPress[0]) mode = "cardA";
      if (this.controls.numKeyPress[1]) mode = "cardB";
      if (!mode) return;

      const intersects = this.controls.getRayCast([this.whiteBoard.container]);
      if (!intersects.length) return;

      const pos = intersects[0].point;
      const center = new THREE.Vector3(pos.x, pos.y, 0);
      const dom = this.setDOM();
      const card = this.cardSet.create(mode, dom, this.controls.mouse, center);
      this.container.add(card);

      this.time.trigger("tick");

      // this api is the bridge from Whiteboard Engine to React App.
      this.app.API.generate({
        id: card.uuid,
        pos,
      });
    });

    // make the whiteboard controllable (all scene in cards remains unchanged)
    this.time.on("spaceUp", () => {
      document.body.style.cursor = "auto";
      this.camera.controls.enabled = true;
      this.cardSet.targetCard = null;

      this.cardSet.list.forEach((card) => {
        const { dom } = card.userData;
        dom.style.display = "none";
      });
    });

    // fix the whiteboard (scene in selected card is controllable)
    this.time.on("spaceDown", () => {
      document.body.style.cursor = "auto";
      this.camera.controls.enabled = false;

      const intersects = this.controls.getRayCast(this.cardSet.list);
      if (!intersects.length) return;
      document.body.style.cursor = "pointer";

      const card = intersects[0].object;
      const { dom, viewer } = card.userData;
      this.cardSet.targetCard = card;

      this.cardSet.list.forEach((c) => {
        const v = c.userData.viewer;
        v.controls.enabled = false;
      });
      viewer.controls.enabled = true;

      const [pbl, ptr] = this.cardSet.updateCanvas(card);
      const { width, height } = this.sizes.viewport;

      dom.style.left = `${(pbl.x + 1) * width * 0.5}px`;
      dom.style.bottom = `${(pbl.y + 1) * height * 0.5}px`;
      dom.style.width = `${(ptr.x - pbl.x) * width * 0.5}px`;
      dom.style.height = `${(ptr.y - pbl.y) * height * 0.5}px`;
      dom.style.display = "inline";
    });
  }

  setDOM() {
    const cardDOM = document.createElement("div");

    cardDOM.className = "cardDOM";
    cardDOM.style.backgroundColor = "rgba(0, 0, 0, 0.0)";
    cardDOM.style.border = "1px solid white";
    cardDOM.style.display = "none";
    cardDOM.style.position = "absolute";
    document.body.appendChild(cardDOM);

    return cardDOM;
  }
}
