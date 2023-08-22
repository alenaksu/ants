import type { World } from "geotic/src/World";
import type { Query } from "geotic/src/Query";
import Ant from "../components/Ant";
import Marker from "../components/Marker";
import Food from "../components/Food";
import Home from "../components/Home";

export default function createMarkerSystem(world: World) {
    const ants: Query = world.createQuery({
        all: [Ant],
    });
    const markers: Query = world.createQuery({
        all: [Marker],
        none: [Home, Food],
    });

    return () => {
        for (const entity of ants.get()) {

            if (entity.ant.state === "exploring") {
                world.createPrefab("HomeMarker", {
                    position: {
                        x: entity.position.x,
                        y: entity.position.y,
                    },
                    marker: {
                        power: entity.ant.markerPower,
                    },
                });
            } else if (entity.ant.state === "carrying_food") {
                world.createPrefab("FoodMarker", {
                    position: {
                        x: entity.position.x,
                        y: entity.position.y,
                    },
                    marker: {
                        power: entity.ant.markerPower,
                    },
                });
            }

            entity.ant.markerPower *= entity.ant.markerPowerRate;
        }

        for (const entity of markers.get()) {
            entity.marker.power *= entity.marker.decayRate;

            if (entity.marker.power <= 1 - entity.marker.decayRate) {
                entity.destroy();
            }
        }
    };
}
