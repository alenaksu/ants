import { Application, Assets, Sprite, Texture } from 'pixi.js';
import { World } from './World';
import { clamp, colors } from '../utils';
import defaultConfig from '../config';
import scentTexture from '../assets/scent.png';

await Assets.load([scentTexture]);

export class Marker extends Sprite {
    power: number = defaultConfig.marker.power;
    evaporationRate: number = defaultConfig.marker.evaporationRate;
    evaporationThreshold: number = defaultConfig.marker.evaporationThreshold;
    permanent: boolean = false;

    static get size() {
        return 8;
    }

    constructor(public world: World, public app: Application, public type: 'food' | 'home') {
        super({ texture: Texture.from(scentTexture) });

        this.anchor.set(0.5);
        this.tint = type === 'food' ? colors.food : colors.home;
        this.alpha = 0.9;
        this.width = this.height = this.size;
    }

    get size() {
        return Marker.size;
    }

    evaporate() {
        if (this.permanent) return;

        this.power *= this.evaporationRate;

        this.alpha = this.visible ? clamp(this.power, 0, 1) : 0;
        // this.scale.set(clamp(this.power / this.size, 0, 2));

        if (this.power <= this.evaporationThreshold) {
            this.destroy();
        }
    }
}
