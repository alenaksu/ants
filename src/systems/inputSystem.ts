import { Application } from 'pixi.js';
import { Config, World } from '../components/World';
import { Pane } from 'tweakpane';

export const createInputSystem = (world: World, app: Application, config: Config) => {
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    const drop = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.buttons) {
            world[e.buttons === 1 ? 'createFood' : 'createHome']({
                x: e.clientX,
                y: e.clientY,
            });
        }
    };

    (app.canvas as HTMLCanvasElement).addEventListener('mousemove', drop);
    (app.canvas as HTMLCanvasElement).addEventListener('mousedown', drop);

    const pane = new Pane();
    pane.addBinding(config, 'antSpeed', {
        min: 0,
        max: 10,
        step: 1,
        label: 'Ant speed',
    }).on('change', (e) => {
        for (const ant of world.ants) {
            ant.speed = e.value;
        }
    });

    pane.addBinding(config, 'smellRange', {
        min: 1,
        max: 500,
        step: 1,
        label: 'Ant smell range',
    }).on('change', (e) => {
        for (const ant of world.ants) {
            ant.smellRange = e.value;
        }
    });

    pane.addBinding(config, 'showMarkers', { label: 'Show markers' }).on('change', (e) => {
        for (const marker of world.markers) {
            marker.visible = e.value;
        }
    });

    pane.addBinding(config, 'pause').on('change', (e) => {
        if (e.value) {
            app.ticker.stop();
        } else {
            app.ticker.start();
        }
    });

    pane.addBlade({
        view: 'separator',
    });

    // pane.addBinding(config, 'blendMode', {
    //     label: 'Blend mode',
    //     options: BLEND_MODES,
    //     value: BLEND_MODES.ADD,
    // }).on('change', (e) => {
    //     world.markersContainer.blendMode = e.value;
    // });

    return () => {};
};
