import { Graphics } from 'pixi.js';

export class HomeMark extends Graphics {
  constructor() {
    super();

    this.beginFill(0x00ff00, 0.4);
    this.drawCircle(0, 0, 2);
  }
}
