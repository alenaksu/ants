import { degToRad } from './utils';

export default {
    ant: {
        antSpeed: 1,
        markerPowerRate: 0.992,
        markerPower: 1,
        smellRange: 20,
        smellAngle: degToRad(130),
        speed: 1,
        rotationNoise: degToRad(30),
        releaseRate: 1,
    },
    marker: {
        evaporationRate: 0.996,
        evaporationThreshold: 0.01,
        power: 1,
    },
};
