import { Graphics } from 'pixi.js';

export class Food extends Graphics {
  constructor() {
    super();

    this.beginFill(0xff00ff, 0.6);
    this.drawCircle(0, 0, 10);
  }
}
