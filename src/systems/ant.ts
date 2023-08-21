import type { World } from 'geotic/src/World';
import Velocity from '../components/Velocity';
import type { Query } from 'geotic/src/Query';
import Ant from '../components/Ant';
import Marker from '../components/Marker';
import { calculateDistance } from '../utils';
import Food from '../components/Food';
import Home from '../components/Home';
import { Entity } from 'geotic/src/Entity';

export default function createAntSystem(world: World) {
  const ants: Query = world.createQuery({
    all: [Ant, Velocity],
  });
  const markers: Query = world.createQuery({
    any: [Marker, Food, Home],
  });

  const foods: Query = world.createQuery({
    all: [Food],
  });

  const homes: Query = world.createQuery({
    all: [Home],
  });

  const visited = new Map<Entity, Set<Entity>>();

  ants.onEntityAdded((entity: any) => {
    visited.set(entity, new Set());
  });

  ants.onEntityRemoved((entity: any) => {
    visited.delete(entity);
  });

  return () => {
    for (const ant of ants.get()) {
      const visitedMarkers = visited.get(ant)!;

      if (ant.ant.state === 'exploring') {
        for (const food of foods.get()) {
          if (calculateDistance(ant, food) < food.food.size) {
            ant.ant.state = 'carrying_food';
            food.destroy();
            visitedMarkers.clear();
            break;
          }
        }
      } else if (ant.ant.state === 'carrying_food') {
        for (const home of homes.get()) {
          if (calculateDistance(ant, home) < home.home.size) {
            ant.ant.state = 'exploring';
            visitedMarkers.clear();
            break;
          }
        }
      }

      for (const marker of markers.get()) {
        if (visitedMarkers.has(marker)) continue;

        const shouldFollowMarker =
          (ant.ant.state === 'exploring' && marker.has(Food)) ||
          (ant.ant.state === 'carrying_food' && marker.has(Home)) ||
          (ant.ant.state === 'exploring' && marker.marker?.type === 'toFood') ||
          (ant.ant.state === 'carrying_food' &&
            marker.marker?.type === 'toHome');

        if (
          shouldFollowMarker &&
          calculateDistance(ant, marker) < ant.ant.smellRange
        ) {
          visitedMarkers.add(marker);
          ant.velocity.direction = Math.atan2(
            marker.position.y - ant.position.y,
            marker.position.x - ant.position.x
          );

          break;
        }
      }
    }
  };
}
