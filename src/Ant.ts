import { Graphics } from "pixi.js";

export class Ant extends Graphics {
    state: "exploring" | "carrying_food" = "exploring";
    markerRate = 20;
    markerPowerRate = 0.995;
    markerPower = 1;
    smellRange = 50;
    speed = 2;
    angleNoise = 0.4;

    // home markers
    // food markers

    constructor() {
        super();

        this.beginFill(0xff0000);
        this.drawRoundedRect(0, 0, 10, 5, 2);
        this.pivot.set(0.5, 0.5);
    }

    walk() {
        this.x += Math.sin(this.angle) * this.speed;
        this.y += Math.cos(this.angle) * this.speed;

        this.x += Math.round(Math.cos(this.angle) * this.speed);
        this.y += Math.round(Math.sin(this.angle) * this.speed);

        const rotation = Math.PI * this.angleNoise;
        this.angle += Math.random() * rotation - rotation / 2;
    }

    pickFood(food: Food) {
        this.state = "carrying_food";
        this.markerPower = 1;
        food.destroy();
    }

    dropFood() {
        this.state = "exploring";
        this.markerPower = 1;
    }

    isExploring() {
        return this.state === "exploring";
    }

    isCarryingFood() {
        return this.state === "carrying_food";
    }

    releaseMarker() {
        const world = this.world;

        if (this.state === "exploring") {
            this.world.createPrefab("HomeMarker", {
                position: {
                    x: this.x,
                    y: this.y,
                },
                marker: {
                    power: this.markerPower,
                },
            });
        } else if (this.state === "carrying_food") {
            world.createPrefab("FoodMarker", {
                position: {
                    x: this.x,
                    y: this.y,
                },
                marker: {
                    power: this.markerPower,
                },
            });
        }

        this.markerPower *= this.markerPowerRate;
    }
}
