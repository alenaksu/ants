import { Application, Assets, Graphics, Sprite, Texture } from 'pixi.js';
import { World } from './World';
import { clamp, colors } from '../utils';
import defaultConfig from '../config';
import scentTexture from '../assets/scent.png';

await Assets.load([scentTexture]);

let texture: Texture;

// function generateSprite(app: Application, size: number) {
//     if (!texture) {
//         const canvas = app.view as HTMLCanvasElement;
//         const gradient = canvas
//             .getContext('2d')
//             ?.createRadialGradient(size / 2, size / 2, size, size / 2, size / 2, size);

//         const disc = new Graphics();
//         // disc.beginFill(0xffffff, 0.8);
//         disc.drawCircle(0, 0, size);
//         disc.cacheAsBitmap = true;
//         disc.endFill();

//         texture = app.renderer.generateTexture(disc);
//     }

//     return texture;
// }

export class Marker extends Sprite {
    power: number = defaultConfig.marker.power;
    evaporationRate: number = defaultConfig.marker.evaporationRate;
    evaporationThreshold: number = defaultConfig.marker.evaporationThreshold;
    permanent: boolean = false;

    static get size() {
        return 8;
    }

    constructor(public world: World, public app: Application, public type: 'food' | 'home') {
        super(Sprite.from(scentTexture));

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

        // console.log('evaporate', {
        //     from: this.power,
        //     to: this.power * this.evaporationRate,
        // });

        this.power *= this.evaporationRate;

        this.alpha = this.visible ? clamp(this.power, 0, 1) : 0;
        // this.scale.set(clamp(this.power / this.size, 0, 2));

        if (this.power <= this.evaporationThreshold) {
            this.destroy();
        }
    }
}
