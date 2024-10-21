import * as PIXI from 'pixi.js';
import { World } from './components/World';
import { createAntSystem } from './systems/antSystem';
import { createMarkerSystem } from './systems/markerSystem';
import { createInputSystem } from './systems/inputSystem';
import defaultConfig from './config';
import { Application } from 'pixi.js';
import { Config } from './types';

const app = new Application();
await app.init({
    background: '#111',
    width: 300,
    height: 300,
    resolution: 1,
    // resizeTo: window,
});

// app.stage.filters = [new PixelateFilter(4)];

const config: Config = {
    ...defaultConfig,
};

const world = new World(app, config);
const antSystem = createAntSystem(world);
const markerSystem = await createMarkerSystem(world, config);
const inputSystem = createInputSystem(world, app, config);

const render: PIXI.TickerCallback<any> = (ticker) => {
    inputSystem();
    antSystem();
    markerSystem(ticker);
};

app.ticker.maxFPS = 60;
app.ticker.minFPS = 60;
app.ticker.add(render);

document.body.appendChild(app.canvas as any);

world.createColony(50, {
    x: app.screen.width / 2,
    y: app.screen.height / 2,
});
