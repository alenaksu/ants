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
        evaporationRate: 0.996,
        evaporationThreshold: 0.01,
        power: 1,
        show: true
    },
    pause: false
} as Config;
