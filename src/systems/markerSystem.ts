import { World } from '../components/World';
import { Config, System } from '../types';

export const createMarkerSystem: System = async (world: World, _config: Config) => {
    return () => {
        for (const food of world.foods) {
            world.foodMarkerMap.releaseMarker(food.x, food.y, 1);
        }

        for (const home of world.homes) {
            world.homeMarkerMap.releaseMarker(home.x, home.y, 1);
        }

        world.homeMarkerMap.evaporate();
        world.foodMarkerMap.evaporate();
    };
};
