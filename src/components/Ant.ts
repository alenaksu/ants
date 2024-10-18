import { Application, Graphics } from 'pixi.js';
import { World } from './World';
import { clamp, colors } from '../utils';
import defaultConfig from '../config';

export class Ant extends Graphics {
    antState: 'foraging' | 'carrying_food' = 'foraging';
    markerPowerRate = defaultConfig.ant.markerPowerRate;
    markerPower = defaultConfig.ant.markerPower;
    smellRange = defaultConfig.ant.smellRange;
    smellAngle = defaultConfig.ant.smellAngle;
    speed = defaultConfig.ant.speed;
    rotationNoise = defaultConfig.ant.rotationNoise;
    releaseRate = defaultConfig.ant.releaseRate;
    lastRelease = 0;

    lastX: number = this.x;
    lastY: number = this.y;

    constructor(public world: World, public app: Application) {
        super();

        this.pivot.set(0, 0.5);

        this.roundRect(0, -2.5, 10, 5, 2);
        this.fill(0xffffff);
        this.dropFood();
    }

    applyRotationNoise() {
        const noise = Math.random() * this.rotationNoise - this.rotationNoise / 2;
        this.rotation = (this.rotation + noise) % (Math.PI * 2);
    }

    walk() {
        if (this.x <= 0 || this.x >= this.app.screen.width) {
            this.x = clamp(this.x, 0, this.app.screen.width);
            this.rotation = Math.PI - this.rotation;
        }

        if (this.y <= 0 || this.y >= this.app.screen.height) {
            this.y = clamp(this.y, 0, this.app.screen.height);
            this.rotation = Math.PI * 2 - this.rotation;
        }

        this.lastX = this.x;
        this.lastY = this.y;

        this.x += Math.cos(this.rotation) * this.speed;
        this.y += Math.sin(this.rotation) * this.speed;
    }

    resetMarkerPower() {
        this.markerPower = 1;
    }

    pickFood() {
        this.antState = 'carrying_food';
        this.tint = colors.food;
    }

    dropFood() {
        this.antState = 'foraging';
        this.tint = colors.ant;
    }

    isForaging() {
        return this.antState === 'foraging';
    }

    isCarryingFood() {
        return this.antState === 'carrying_food';
    }

    releaseMarker() {
        const x = Math.floor(this.x);
        const y = Math.floor(this.y);
        const lastX = Math.floor(this.lastX);
        const lastY = Math.floor(this.lastY);

        if (x === lastX && y === lastY) return;
        if (++this.lastRelease < this.releaseRate) return;

        const world = this.world;

        const marker = world.createMarker(this.antState === 'foraging' ? 'home' : 'food', {
            x,
            y,
            power: this.markerPower,
        });

        // console.log('release', {
        //     x,
        //     y,
        //     power: this.markerPower,
        // });

        this.markerPower *= this.markerPowerRate;
        this.lastRelease = 0;

        return marker;
    }
}
