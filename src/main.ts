import * as PIXI from 'pixi.js';
import { Config, World } from './components/World';
import { createAntSystem } from './systems/antSystem';
import { createMarkerSystem } from './systems/markerSystem';
import { createInputSystem } from './systems/inputSystem';
import defaultConfig from './config';
import { Application } from 'pixi.js';

const app = new Application();
await app.init({
    background: '#333',
    resizeTo: window,
});

// app.stage.filters = [new PixelateFilter(4)];

const config: Config = {
    ...defaultConfig,
    antSpeed: 1,
    smellRange: 50,
    pause: false,
    blendMode: 'add',
    showMarkers: true,
    speed: 1,
};

const world = new World(app, config);
const antSystem = createAntSystem(world);
const markerSystem = await createMarkerSystem(world);
const inputSystem = createInputSystem(world, app, config);

const render: PIXI.TickerCallback<any> = (ticker) => {
    inputSystem();
    antSystem();
    markerSystem();
};

app.ticker.maxFPS = 30;
app.ticker.minFPS = 30;
app.ticker.add(render);

document.body.appendChild(app.canvas as any);

world.createColony(100, {
    x: app.screen.width / 2,
    y: app.screen.height / 2,
});
