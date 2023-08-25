import { World } from "../components/World";

export const createMarkerSystem = (world: World) => {
    return () => {
        for (const marker of world.markers) {
            marker.evaporate();
        }
    };
};