import { Ant } from '../components/Ant';
import { Marker } from '../components/Marker';
import { World } from '../components/World';

export const createAntSystem = (world: World) => {
    const visited = new WeakMap<Ant, Set<Marker>>();

    return () => {
        for (const ant of world.ants) {
            if (!visited.has(ant)) {
                visited.set(ant, new Set());
            }

            const visitedMarkers = visited.get(ant)!;

            for (const food of world.foods) {
                if (food.containsPoint(ant)) {
                    if (ant.isForaging()) {
                        ant.pickFood();
                        ant.rotation += Math.PI;
                        food.consume();
                        visitedMarkers.clear();
                    }

                    ant.resetMarkerPower();
                    break;
                }
            }

            for (const home of world.homes) {
                if (home.containsPoint(ant)) {
                    if (ant.isCarryingFood()) {
                        ant.dropFood();
                        ant.rotation += Math.PI;
                        visitedMarkers.clear();
                    }

                    ant.resetMarkerPower();
                    break;
                }
            }

            let strongestMarker: any;
            const map = ant.isCarryingFood() ? world.homeMarkerMap : world.foodMarkerMap;
            const halfSmellRange = Math.round(ant.smellRange / 2);

            const antX = Math.round(ant.x);
            const antY = Math.round(ant.y);

            for (let y = antY - halfSmellRange; y < antY + halfSmellRange; y++) {
                for (let x = antX - halfSmellRange; x < antX + halfSmellRange; x++) {
                    if (antY === y && antX === x) continue;

                    const marker = map.get(x, y);

                    if (!marker || marker.destroyed || !marker.power || visitedMarkers.has(marker))
                        continue;

                    const angle = Math.abs(
                        Math.atan2(marker.y - ant.y, marker.x - ant.x) - ant.rotation
                    );
                    const inRange = angle < 5 * Math.PI / 6;

                    if (
                        inRange &&
                        ((ant.isForaging() && marker.type === 'food') ||
                            (ant.isCarryingFood() && marker.type === 'home'))
                    ) {
                        if (!marker.permanent) {
                            visitedMarkers.add(marker);
                        }

                        strongestMarker =
                            strongestMarker && strongestMarker.power > marker.power
                                ? strongestMarker
                                : marker;
                    }
                }
            }

            // const rotationAngle = Math.PI / 6;
            // const rotation = ant.rotation;

            // const left = map.get(
            //     Math.round(antX - Math.cos(rotation)) * ant.smellRange,
            //     Math.round(antY - Math.sin(rotation)) * ant.smellRange
            // );
            // const center = map.get(
            //     Math.round(antX - Math.cos(rotation - rotationAngle)) * ant.smellRange,
            //     Math.round(antY - Math.sin(rotation - rotationAngle)) * ant.smellRange
            // );
            // const right = map.get(
            //     Math.round(antX - Math.cos(rotation + rotationAngle)) * ant.smellRange,
            //     Math.round(antY - Math.sin(rotation + rotationAngle)) * ant.smellRange
            // );

            // strongestMarker = [left, center, right]
            //     .sort((a, b) => (b?.power ?? 0) - (a?.power ?? 0))
            //     .at(0);

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
