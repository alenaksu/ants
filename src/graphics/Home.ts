import { Graphics } from 'pixi.js';

export class Home extends Graphics {
  constructor() {
    super();

    this.beginFill(0xffff00, 0.6);
    this.drawCircle(0, 0, 10);
  }
}
