import type { World } from 'geotic/src/World';
import type { Query } from 'geotic/src/Query';
import { Application } from 'pixi.js';
import Ant from '../components/Ant';
import type { Entity } from 'geotic/src/Entity';
import Marker from '../components/Marker';

export default function createMarkerSystem(world: World) {
  const ants: Query = world.createQuery({
    all: [Ant],
  });
  const markers: Query = world.createQuery({
    all: [Marker],
  });

  const all: Query = world.createQuery({
    any: [Ant, Marker],
  });

  const timers = new Map<Entity, number>();
  all.onEntityAdded((entity: any) => {
    timers.set(entity, performance.now());
  });

  all.onEntityRemoved((entity: any) => {
    timers.delete(entity);
  });

  return () => {
    for (const entity of ants.get()) {
      const lastRelease = timers.get(entity) ?? 0;

      if (performance.now() - lastRelease > entity.ant.markerFrequency) {
        if (entity.ant.state === 'exploring') {
          world.createPrefab('HomeMarker', {
            position: {
              x: entity.position.x,
              y: entity.position.y,
            },
          });
        } else if (entity.ant.state === 'carrying_food') {
          world.createPrefab('FoodMarker', {
            position: {
              x: entity.position.x,
              y: entity.position.y,
            },
          });
        }

        timers.set(entity, performance.now());
      }
    }

    for (const entity of markers.get()) {
      const creationTime = timers.get(entity) ?? 0;
      if (performance.now() - creationTime > entity.marker.lifespan) {
        entity.destroy();
      }
    }
  };
}
