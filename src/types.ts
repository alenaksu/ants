import { TickerCallback } from "pixi.js";
import { World } from "./components/World";

export interface Config {
    ant: {
        speed: number;
        markerPowerRate: number;
        markerPower: number;
        smellRange: number;
        smellAngle: number;
        rotationNoise: number;
        releaseRate: number;
    };
    marker: {
        evaporationRate: number;
        evaporationThreshold: number;
        power: number;
        maxPower: number;
        show: boolean;
    };
    scale: number;
    antCount: number;
    pause: boolean;
}

export interface System {
    (world: World, config: Config): TickerCallback<void> | Promise<TickerCallback<void>>;
}