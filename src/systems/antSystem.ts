import { World } from '../components/World';
import { System } from '../types';

export const createAntSystem: System = (world: World) => {
    return () => {
        for (const ant of world.ants) {
            for (const food of world.foods) {
                if (food.getBounds().containsPoint(ant.x, ant.y)) {
                    if (ant.isForaging()) {
                        ant.pickFood();
                        ant.rotation += Math.PI;
                        food.consume();
                    }

                    ant.resetMarkerPower();
                    break;
                }
            }

            for (const home of world.homes) {
                if (home.getBounds().containsPoint(ant.x, ant.y)) {
                    if (ant.isCarryingFood()) {
                        ant.dropFood();
                        ant.rotation += Math.PI;
                    }

                    ant.resetMarkerPower();
                    break;
                }
            }

            let strongestMarker: {
                x: number;
                y: number;
                power: number;
            } = {
                x: 0,
                y: 0,
                power: 0,
            };
            const map = ant.isCarryingFood() ? world.homeMarkerMap : world.foodMarkerMap;

            const antX = Math.floor(ant.x);
            const antY = Math.floor(ant.y);
            const halfSmellRange = Math.ceil(ant.smellRange / 2);
            const antHalfSmellAngle = ant.smellAngle / 2;

            for (let y = antY - halfSmellRange; y < antY + halfSmellRange; y++) {
                for (let x = antX - halfSmellRange; x < antX + halfSmellRange; x++) {
                    if (antY === y && antX === x) continue;

                    const angle = Math.abs(
                        (Math.atan2(y - ant.y, x - ant.x) - ant.rotation) % (2 * Math.PI)
                    );

                    const inRange = angle > -antHalfSmellAngle && angle < antHalfSmellAngle;
                    // console.log((angle * 180) / Math.PI, angle, inRange);

                    if (inRange) {
                        const marker = map.get(x, y);
                        strongestMarker =
                            strongestMarker.power > marker
                                ? strongestMarker
                                : {
                                      x,
                                      y,
                                      power: marker,
                                  };
                    }
                }
            }

            if (strongestMarker.power > world.config.marker.evaporationThreshold) {
                ant.rotation = Math.atan2(strongestMarker.y - ant.y, strongestMarker.x - ant.x);
            } else {
                ant.applyRotationNoise();
            }

            ant.walk();
            ant.releaseMarker();
        }
    };
};
