import { Sprite, Texture } from 'pixi.js';
import sprite from '../assets/circle_05.png';

export class FoodMark extends Sprite {
  constructor() {
    super(Texture.from(sprite));

    this.anchor.set(0.5);
    this.tint = 0x0000FF;
    this.width = this.height = 5;
  }
}
