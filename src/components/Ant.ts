import { Component } from "geotic";
import { Entity } from "geotic/src/Entity";

export default class Ant extends Component {
    declare state: "exploring" | "carrying_food";
    declare markerRate: number;
    declare markerPowerRate: number;
    declare markerPower: number;
    declare smellRange: number;

    static properties = {
        state: "exploring",
        markerRate: 20,
        markerPowerRate: 0.995,
        markerPower: 1,
        smellRange: 50,
    };

    pickFood(food: Entity) {
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
        const entity = this.entity;

        if (this.state === "exploring") {
            this.world.createPrefab("HomeMarker", {
                position: {
                    x: entity.position.x,
                    y: entity.position.y,
                },
                marker: {
                    power: this.markerPower,
                },
            });
        } else if (this.state === "carrying_food") {
            world.createPrefab("FoodMarker", {
                position: {
                    x: entity.position.x,
                    y: entity.position.y,
                },
                marker: {
                    power: this.markerPower,
                },
            });
        }

        this.markerPower *= this.markerPowerRate;
    }
}
