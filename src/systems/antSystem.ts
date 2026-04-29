import { World } from '../components/World';
import { System } from '../types';

export const createAntSystem: System = (world: World) => {
    return () => {
        for (const ant of world.ants) {
            // Food collision
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

            // Home collision
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

            // Pheromone sensing: 3 directional probes at smellRange distance
            // Left probe, center probe, right probe — spaced by smellAngle/2
            const map = ant.isCarryingFood() ? world.homeMarkerMap : world.foodMarkerMap;
            const rot = ant.rotation;
            const dist = ant.smellRange;
            const spread = ant.smellAngle / 2;

            const probeL = map.get(
                ant.x + Math.cos(rot - spread) * dist,
                ant.y + Math.sin(rot - spread) * dist
            );
            const probeC = map.get(
                ant.x + Math.cos(rot) * dist,
                ant.y + Math.sin(rot) * dist
            );
            const probeR = map.get(
                ant.x + Math.cos(rot + spread) * dist,
                ant.y + Math.sin(rot + spread) * dist
            );

            const threshold = world.config.marker.evaporationThreshold;

            if (Math.max(probeL, probeC, probeR) > threshold) {
                // Steer toward the strongest probe
                if (probeC >= probeL && probeC >= probeR) {
                    // Center is strongest — keep heading, no correction needed
                } else if (probeL > probeR) {
                    ant.rotation -= spread * 0.5;
                } else {
                    ant.rotation += spread * 0.5;
                }
            } else {
                ant.applyRotationNoise();
            }

            ant.walk();
            ant.releaseMarker();
        }
    };
};
