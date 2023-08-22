import { Sprite, Texture } from "pixi.js";
import sprite from "../assets/circle_05.png";

export class Home extends Sprite {
    constructor() {
        super(Texture.from(sprite));

        this.anchor.set(0.5);
        this.tint = 0xffff00;
        this.width = this.height = 50;
    }
}

