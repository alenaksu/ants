import * as PIXI from 'pixi.js';
import { World } from './components/World';
import { createAntSystem } from './systems/antSystem';
import { createMarkerSystem } from './systems/markerSystem';
import { createInputSystem } from './systems/inputSystem';
import defaultConfig from './config';
import { Application } from 'pixi.js';
import { Config } from './types';

const config: Config = {
    ...defaultConfig,
};

const app = new Application();
await app.init({
    background: '#111',
    width: Math.floor(window.innerWidth * config.scale),
    height: Math.floor(window.innerHeight * config.scale),
    resolution: 1,
});

const world = new World(app, config);
const antSystem = await createAntSystem(world, config);
const markerSystem = await createMarkerSystem(world, config);
const inputSystem = await createInputSystem(world, config);

const render: PIXI.TickerCallback<any> = (ticker) => {
    inputSystem(ticker);
    antSystem(ticker);
    markerSystem(ticker);
};

app.ticker.maxFPS = 60;
app.ticker.minFPS = 60;
app.ticker.add(render);

document.body.appendChild(app.canvas as any);

world.createColony(config.antCount, {
    x: app.screen.width / 2,
    y: app.screen.height / 2,
});
