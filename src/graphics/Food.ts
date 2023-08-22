import { Sprite, Texture } from "pixi.js";
import sprite from "../assets/circle_05.png";


export class Food extends Sprite {
    constructor() {
      super(Texture.from(sprite));

        this.anchor.set(0.5);
        this.tint = 0xff00ff;
        this.width = this.height = 20;
    }
}
