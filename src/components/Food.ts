import { Application, Graphics } from 'pixi.js';
import { World } from './World';
import { colors } from '../utils';

export class Food extends Graphics {
    size = 50;

    constructor(public world: World, public app: Application) {
        super();

        this.pivot.set(0.5);

        this.beginFill(colors.food);
        this.drawCircle(0, 0, this.size);
        this.endFill();

        this.setSize(this.size);
    }

    consume() {
        this.setSize(this.size - 1);

        if (!this.size) {
            this.destroy();
        }
    }

    setSize(value: number) {
        this.width = this.height = value;
        this.size = value;
    }
}
