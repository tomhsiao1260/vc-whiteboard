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
      app: this.app,
      time: this.time,
      sizes: this.sizes,
      camera: this.camera,
      renderer: this.renderer,
    });

    // generate a card when clicking
    this.time.on("mouseDown", () => {
      let segmentID;
      if (this.controls.numKeyPress[0]) segmentID = "20230522181603";
      if (this.controls.numKeyPress[1]) segmentID = "20230509182749";
      if (this.controls.numKeyPress[2]) segmentID = "20230702185752";
      if (this.controls.numKeyPress[3]) segmentID = " ";
      if (!segmentID) return;

      const intersects = this.controls.getRayCast([this.whiteBoard.container]);
      if (!intersects.length) return;

      const pos = intersects[0].point;
      const center = new THREE.Vector3(pos.x, pos.y, 0);
      const dom = this.setDOM();
      const card = this.cardSet.create(segmentID, dom, this.controls.mouse, center);
      this.container.add(card);

      this.time.trigger("tick");

      // this api is the bridge from Whiteboard Engine to React App.
      const { id, x, y, width, height } = this.getScreenPosition(card);
      this.app.API.cardGenerate({ segmentID, id, x, y, width, height });
      this.app.API.cardInit({ segmentID, id, x, y, width, height });
    });

    // mouse pointer
    this.time.on('mouseMove', () => {
      document.body.style.cursor = 'auto';

      const intersects = this.controls.getRayCast(this.cardSet.list);
      if (!intersects.length) return;
      document.body.style.cursor = 'pointer';
    });

    // drag the card
    this.cardDonwPos = null
    this.mouseDownPos = null
    this.mouseNowPos = null

    this.time.on('mouseDown', () => {
      const intersects = this.controls.getRayCast(this.cardSet.list);
      if (!intersects.length) return;

      const card = intersects[0].object;
      this.cardSet.targetCard = card;
      this.mouseDownPos = intersects[0].point;
      this.cardDownPos = card.position.clone();
      this.camera.controls.enabled = false;
    });
    this.time.on('mouseMove', () => {
      if (!this.controls.mousePress) { this.cardDonwPos = null; this.mouseDownPos = null; this.mouseNowPos = null; return; }
      if (!this.mouseDownPos || !this.cardSet.targetCard || this.controls.spacePress) { return; }

      const intersects = this.controls.getRayCast([this.whiteBoard.container]);
      if (!intersects.length) return;

      this.mouseNowPos = intersects[0].point;
      const pos = this.cardDownPos.clone().add(this.mouseNowPos).sub(this.mouseDownPos);
      this.cardSet.targetCard.position.copy(pos);
      this.cardSet.targetCard.userData.center = pos;

      const { dom } = this.cardSet.targetCard.userData;
      const [pbl, ptr] = this.cardSet.updateCanvas(this.cardSet.targetCard);
      const { width, height } = this.sizes.viewport;

      dom.style.left = `${(pbl.x + 1) * width * 0.5}px`;
      dom.style.bottom = `${(pbl.y + 1) * height * 0.5}px`;
      dom.style.width = `${(ptr.x - pbl.x) * width * 0.5}px`;
      dom.style.height = `${(ptr.y - pbl.y) * height * 0.5}px`;
      dom.style.display = "none";

      const info = this.getScreenPosition(this.cardSet.targetCard);
      this.app.API.cardMove(info);

      this.time.trigger("tick");
    });
    this.time.on('mouseUp', () => {
      this.camera.controls.enabled = true;
      if (!this.cardSet.targetCard) return;

      const { dom } = this.cardSet.targetCard.userData;
      dom.style.display = "none";
      this.cardSet.targetCard = null;
    });

    // make the whiteboard controllable (all scene in cards remains unchanged)
    this.time.on("spaceUp", () => {
      if (!this.cardSet.targetCard) return
      this.app.API.cardLeave(!this.cardSet.targetCard.uuid)

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
      this.camera.controls.enabled = false;
      const intersects = this.controls.getRayCast(this.cardSet.list);

      if (!intersects.length && this.cardSet.targetCard) { this.app.API.cardLeave(this.cardSet.targetCard.uuid); }
      if (intersects.length && this.cardSet.targetCard && this.cardSet.targetCard.uuid !== intersects[0].object.uuid) { this.app.API.cardLeave(this.cardSet.targetCard.uuid); }
      if (!intersects.length) { this.cardSet.targetCard = null; return; }

      const card = intersects[0].object;
      const { dom, viewer, w, h } = card.userData;

      if (!this.cardSet.targetCard || (this.cardSet.targetCard && this.cardSet.targetCard.uuid !== card.uuid)) {
        const info = this.getScreenPosition(card);
        this.app.API.cardSelect(info);
      }
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

  getScreenPosition(card) {
    const { w, h } = card.userData;
    const center = card.position.clone();
    const corner = new THREE.Vector3(center.x + w / 2, center.y + h / 2, center.z);
    center.project(this.camera.instance);
    corner.project(this.camera.instance);

    const id = card.uuid;
    const x = this.sizes.width * (1 + center.x) / 2;
    const y = this.sizes.height * (1 - center.y) / 2;
    const width = this.sizes.width * Math.abs(corner.x - center.x) / 2;
    const height = this.sizes.height * Math.abs(corner.y - center.y) / 2;

    return { id, x, y, width, height }
  }

  setDOM() {
    const cardDOM = document.createElement("div");

    cardDOM.className = "cardDOM";
    cardDOM.style.backgroundColor = "rgba(0, 0, 0, 0.0)";
    // cardDOM.style.border = "1px solid white";
    cardDOM.style.display = "none";
    cardDOM.style.position = "absolute";
    document.body.appendChild(cardDOM);

    return cardDOM;
  }
}
