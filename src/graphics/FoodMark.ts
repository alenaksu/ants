import { Graphics } from 'pixi.js';

export class FoodMark extends Graphics {
  constructor() {
    super();

    this.beginFill(0x0000ff, 0.4);
    this.drawCircle(0, 0, 2);
  }
}
