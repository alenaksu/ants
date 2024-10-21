import { Ticker } from "pixi.js";
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
        show: boolean;
    };
    pause: boolean;
}

export interface TickerFunction {
    (ticker: Ticker): void | Promise<void>;
}

export interface System {
    (world: World, config: Config): TickerFunction | Promise<TickerFunction>;
}