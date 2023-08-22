import type { World } from "geotic/src/World";
import Velocity from "../components/Velocity";
import type { Query } from "geotic/src/Query";
import Ant from "../components/Ant";
import Marker from "../components/Marker";
import { calculateDistance } from "../utils";
import Food from "../components/Food";
import Home from "../components/Home";
import { Application } from "pixi.js";
import Decay from "../components/Decay";
import { Entity } from "geotic/src/Entity";

export default function createColonySystem(world: World, app: Application) {
    const ants: Query = world.createQuery({
        all: [Ant, Velocity],
    });
    const markers: Query = world.createQuery({
        any: [Marker],
    });

    const foods: Query = world.createQuery({
        all: [Food],
    });

    const homes: Query = world.createQuery({
        all: [Home],
    });

    const decyables: Query = world.createQuery({
        any: [Decay],
    });

    const visited = new Map<Entity, Set<Entity>>();

    ants.onEntityAdded((entity: any) => {
        visited.set(entity, new Set());
    });

    ants.onEntityRemoved((entity: any) => {
        visited.delete(entity);
    });

    const markerMap: Record<string, any[]> = {
        toFood: Array(app.view.width * app.view.height),
        toHome: Array(app.view.width * app.view.height),
    };

    markers.onEntityAdded((entity: any) => {
        const map = markerMap[entity.marker.type];
        const index = entity.position.y * app.view.width + entity.position.x;
        if (
            !map[index] ||
            map[index].isDestroyed ||
            entity.marker.power > map[index].marker.power
        ) {
            map[index] = entity;
        }
    });

    // markers.onEntityRemoved((entity: any) => {
    //     const map = markerMap[entity.marker.type];
    //     const index = entity.position.y * app.view.width + entity.position.x;
    //     map[index] = undefined;
    // });

    return () => {
        for (const antEntity of ants.get()) {
            if (antEntity.ant.isExploring()) {
                for (const food of foods.get()) {
                    if (calculateDistance(antEntity, food) < food.food.size) {
                        antEntity.ant.pickFood(food);
                        break;
                    }
                }
            }

            for (const home of homes.get()) {
                if (calculateDistance(antEntity, home) < home.home.size) {
                    antEntity.ant.dropFood();
                    break;
                }
            }

            antEntity.ant.releaseMarker();

            for (const entity of decyables.get()) {
                entity.marker.power *= entity.decay.rate;
                if (entity.marker.power <= 1 - entity.marker.decayRate) {
                    entity.destroy();
                }
            }

            let strongestMarker: any;
            const map = antEntity.ant.isCarryingFood() ? markerMap.toHome : markerMap.toFood;
            const visitedMarkers = visited.get(antEntity)!;
            const halfSmellRange = Math.ceil(antEntity.ant.smellRange / 2);
            for (
                let y = antEntity.position.y - halfSmellRange;
                y < antEntity.position.y + halfSmellRange;
                y++
            ) {
                for (
                    let x = antEntity.position.x - halfSmellRange;
                    x < antEntity.position.x + halfSmellRange;
                    x++
                ) {
                    const markerEntity = map[y * app.view.width + x];
                    if (!markerEntity || markerEntity.isDestroyed) continue;
                    if (visitedMarkers.has(markerEntity)) continue;

                    const inRange =
                        calculateDistance(antEntity, markerEntity) < antEntity.ant.smellRange;

                    if (!inRange) continue;

                    if (antEntity.ant.isExploring() && markerEntity.marker.type === "toFood") {
                        strongestMarker =
                            strongestMarker &&
                            strongestMarker.marker.power > markerEntity.marker.power
                                ? strongestMarker
                                : markerEntity;
                    } else if (
                        antEntity.ant.isCarryingFood() &&
                        markerEntity.marker.type === "toHome"
                    ) {
                        strongestMarker =
                            strongestMarker &&
                            strongestMarker.marker.power > markerEntity.marker.power
                                ? strongestMarker
                                : markerEntity;
                    }
                }
            }

            // for (const markerEntity of markers.get()) {
            //     const inRange =
            //         calculateDistance(antEntity, markerEntity) < antEntity.ant.smellRange;
            //     if (inRange) {
            //         if (antEntity.ant.isExploring() && markerEntity.marker.type === "toFood") {
            //             strongestMarker =
            //                 strongestMarker &&
            //                 strongestMarker.marker.power > markerEntity.marker.power
            //                     ? strongestMarker
            //                     : markerEntity;
            //         } else if (
            //             antEntity.ant.isCarryingFood() &&
            //             markerEntity.marker.type === "toHome"
            //         ) {
            //             strongestMarker =
            //                 strongestMarker &&
            //                 strongestMarker.marker.power > markerEntity.marker.power
            //                     ? strongestMarker
            //                     : markerEntity;
            //         }
            //     }
            // }

            if (strongestMarker) {
                // visitedMarkers.add(strongestMarker);
                antEntity.velocity.direction = Math.atan2(
                    strongestMarker.position.y - antEntity.position.y,
                    strongestMarker.position.x - antEntity.position.x
                );
            }
        }
    };
}
