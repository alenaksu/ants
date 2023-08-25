import { Application, Graphics } from 'pixi.js';
import { World } from './World';
import { clamp, colors } from '../utils';

export class Ant extends Graphics {
    antState: 'foraging' | 'carrying_food' = 'foraging';
    markerPowerRate = 0.998;
    markerPower = 1;
    smellRange = 20;
    speed = 1;
    rotationNoise = Math.PI / 6;
    releaseRate = 1;
    lastRelease = 0;

    lastX: number = this.x;
    lastY: number = this.y;

    constructor(public world: World, public app: Application) {
        super();

        this.pivot.set(0, 0.5);

        this.beginFill(0xffffff);
        this.drawRoundedRect(0, -2.5, 10, 5, 2);
        this.endFill();
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
        if (this.x === this.lastX && this.y === this.lastY) return;
        if (++this.lastRelease < this.releaseRate) return;

        const world = this.world;

        const marker = world.createMarker(this.antState === 'foraging' ? 'home' : 'food', {
            x: Math.round(this.x),
            y: Math.round(this.y),
            power: this.markerPower,
        });

        this.markerPower *= this.markerPowerRate * this.releaseRate;
        this.lastRelease = 0;

        return marker;
    }
}
