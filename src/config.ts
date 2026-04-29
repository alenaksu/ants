import { Config } from './types';
import { degToRad } from './utils';

export default {
    ant: {
        speed: 1,
        markerPowerRate: 0.991,
        markerPower: 1,
        smellRange: 20,
        smellAngle: degToRad(120),
        rotationNoise: degToRad(30),
        releaseRate: 1,
    },
    marker: {
        evaporationRate: 0.998,
        evaporationThreshold: 0.001,
        power: 1,
        maxPower: 10,
        show: true
    },
    scale: 0.5,
    antCount: 200,
    pause: false
} as Config;
