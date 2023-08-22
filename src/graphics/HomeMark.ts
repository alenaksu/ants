import { Sprite, Texture } from 'pixi.js';
import sprite from '../assets/circle_05.png';

export class HomeMark extends Sprite {
  constructor() {
    super(Texture.from(sprite));

    this.anchor.set(0.5);
    this.tint = 0x003300;
    this.width = this.height = 5;
  }
}
