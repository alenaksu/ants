import * as PIXI from 'pixi.js';
import { range } from './utils';
import { Engine } from 'geotic';
import Position from './components/Position';
import { Renderable } from './components/Renderable';
import Velocity from './components/Velocity';
import createMovementSystem from './systems/movement';
import createRenderSystem from './systems/render';
import antPrefab from './prefabs/ant.json' assert { type: 'json' };
import foodMarkerPrefab from './prefabs/foodMarker.json' assert { type: 'json' };
import homeMarkerPrefab from './prefabs/homeMarker.json' assert { type: 'json' };
import foodPrefab from './prefabs/food.json' assert { type: 'json' };
import homePrefab from './prefabs/home.json' assert { type: 'json' };
import createMarkerSystem from './systems/marker';
import Marker from './components/Marker';
import Ant from './components/Ant';
import createAntSystem from './systems/ant';
import Food from './components/Food';
import Home from './components/Home';

export const engine = new Engine();
engine.registerComponent(Position);
engine.registerComponent(Renderable);
engine.registerComponent(Velocity);
engine.registerComponent(Marker);
engine.registerComponent(Ant);
engine.registerComponent(Food);
engine.registerComponent(Home);

engine.registerPrefab(antPrefab);
engine.registerPrefab(foodMarkerPrefab);
engine.registerPrefab(homeMarkerPrefab);
engine.registerPrefab(foodPrefab);
engine.registerPrefab(homePrefab);

const app = new PIXI.Application({
  background: '#1099bb',
  resizeTo: window,
});

const world = engine.createWorld();
const movementSystem = createMovementSystem(world, app);
const renderSystem = createRenderSystem(world, app);
const markerSystem = createMarkerSystem(world);
const antSystem = createAntSystem(world);

const render = (dt: number) => {
  movementSystem();
  antSystem();
  markerSystem();
  renderSystem();
};

app.ticker.maxFPS = 60;
app.ticker.minFPS = 60;
app.ticker.add(render);

app.ticker.speed = 10;

document.body.appendChild(app.view as any);

window.addEventListener('contextmenu', (e) => e.preventDefault());
(app.view as HTMLCanvasElement).addEventListener(
  'mousemove',
  (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.buttons) {
      world.createPrefab(e.buttons === 1 ? 'Food' : 'Home', {
        position: {
          x: e.clientX,
          y: e.clientY,
        },
      });
    }
  }
);

world.createPrefab('Home', {
  position: {
    x: app.screen.width / 2,
    y: app.screen.height / 2,
  },
});

for (const _ of [...range(200)]) {
  world.createPrefab('Ant', {
    position: {
      x: app.screen.width / 2,
      y: app.screen.height / 2,
    },
    velocity: {
      direction: Math.PI * 2 * Math.random(),
    },
  });
}
