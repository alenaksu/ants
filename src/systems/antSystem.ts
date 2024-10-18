import { Ant } from '../components/Ant';
import { Marker } from '../components/Marker';
import { World } from '../components/World';

export const createAntSystem = (world: World) => {
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

            let strongestMarker: any;
            const map = ant.isCarryingFood() ? world.homeMarkerMap : world.foodMarkerMap;

            const antX = Math.floor(ant.x);
            const antY = Math.floor(ant.y);
            const halfSmellRange = Math.ceil(ant.smellRange / 2);
            const antHalfSmellAngle = ant.smellAngle / 2;

            for (let y = antY - halfSmellRange; y < antY + halfSmellRange; y++) {
                for (let x = antX - halfSmellRange; x < antX + halfSmellRange; x++) {
                    if (antY === y && antX === x) continue;

                    const marker = map.get(x, y);

                    if (!marker || marker.destroyed || !marker.power) continue;

                    const angle = Math.abs(
                        (Math.atan2(marker.y - ant.y, marker.x - ant.x) - ant.rotation) %
                            (2 * Math.PI)
                    );
                    const inRange = angle < antHalfSmellAngle;
                    // console.log((angle * 180) / Math.PI, angle, inRange);

                    if (
                        inRange &&
                        ((ant.isForaging() && marker.type === 'food') ||
                            (ant.isCarryingFood() && marker.type === 'home'))
                    ) {
                        strongestMarker =
                            strongestMarker && strongestMarker.power > marker.power
                                ? strongestMarker
                                : marker;
                    }
                }
            }

            if (strongestMarker) {
                ant.rotation = Math.atan2(strongestMarker.y - ant.y, strongestMarker.x - ant.x);
            } else {
                ant.applyRotationNoise();
            }

            ant.walk();
            ant.releaseMarker();
        }
    };
};
