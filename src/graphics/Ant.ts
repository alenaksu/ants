import { Graphics } from 'pixi.js';

export class Ant extends Graphics {
  constructor() {
    super();

    this.beginFill(0xff0000);
    this.drawCircle(0, 0, 5);
  }
}
