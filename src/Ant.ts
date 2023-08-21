import { Graphics } from 'pixi.js';

export class Ant extends Graphics {
  direction = 0;
  speed = 1;
  maxTurning = Math.PI * 0.02;

  // home markers
  // food markers

  constructor() {
    super();

    this.beginFill(0xff0000);
    this.drawCircle(0, 0, 5);
  }

  walk() {
    this.x += Math.sin(this.direction) * this.speed;
    this.y += Math.cos(this.direction) * this.speed;

    this.direction += Math.random() * this.maxTurning - this.maxTurning / 2;
  }
}
