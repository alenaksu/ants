import { Graphics } from 'pixi.js';

export class Ant extends Graphics {
  constructor() {
    super();

    this.beginFill(0xff0000);
    this.drawRoundedRect(0, 0, 10, 5, 2);
    this.pivot.set(0.5, 0.5);
  }
}
