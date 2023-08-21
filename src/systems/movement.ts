import type { World } from 'geotic/src/World';
import Position from '../components/Position';
import Velocity from '../components/Velocity';
import type { Query } from 'geotic/src/Query';
import { Application } from 'pixi.js';
import { clamp } from '../utils';

export default function createMovementSystem(world: World, app: Application) {
  const movableEntities: Query = world.createQuery({
    all: [Position, Velocity],
  });

  return () => {
    for (const entity of movableEntities.get()) {
      if (entity.position.x <= 0 || entity.position.x >= app.screen.width) {
        entity.position.x = clamp(entity.position.x, 0, app.screen.width);
        entity.velocity.direction = Math.PI - entity.velocity.direction;
      }

      if (entity.position.y <= 0 || entity.position.y >= app.screen.height) {
        entity.position.y = clamp(entity.position.y, 0, app.screen.height);
        entity.velocity.direction = Math.PI * 2 - entity.velocity.direction;
      }

      entity.position.x +=
        Math.cos(entity.velocity.direction) * entity.velocity.speed;
      entity.position.y +=
        Math.sin(entity.velocity.direction) * entity.velocity.speed;

      entity.velocity.direction +=
        Math.random() * entity.velocity.rotationFactor -
        entity.velocity.rotationFactor / 2;
    }
  };
}
