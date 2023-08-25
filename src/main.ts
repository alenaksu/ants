import * as PIXI from 'pixi.js';
import { PixelateFilter } from '@pixi/filter-pixelate';
import { World } from './components/World';
import { createAntSystem } from './systems/antSystem';
import { createMarkerSystem } from './systems/markerSystem';
import { createInputSystem } from './systems/inputSystem';

const app = new PIXI.Application({
    background: '#333',
    resizeTo: window,
});
app.ticker.speed = 0.3;

// app.stage.filters = [new PixelateFilter(4)];

const config = {
    antSpeed: 4,
    smellRange: 50,
    pause: false,
    blendMode: PIXI.BLEND_MODES.ADD,
    showMarkers: true,
    speed: 1
};

const world = new World(app, config);
const antSystem = createAntSystem(world);
const markerSystem = createMarkerSystem(world);
const inputSystem = createInputSystem(world, app, config);

const render: PIXI.TickerCallback<any> = (dt: number) => {
    inputSystem();
    antSystem();
    markerSystem();
};

app.ticker.maxFPS = 60;
app.ticker.minFPS = 60;
app.ticker.add(render);

document.body.appendChild(app.view as any);

world.createColony(100, {
    x: app.view.width / 2,
    y: app.view.height / 2
});
