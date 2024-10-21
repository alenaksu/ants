import { Application } from 'pixi.js';
import { World } from '../components/World';
import { Pane } from 'tweakpane';
import { Config } from '../types';

export const createInputSystem = (world: World, app: Application, config: Config) => {
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    const drop = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        
        const bounds = app.canvas.getBoundingClientRect();
        const yScale = app.screen.height / app.canvas.clientHeight;
        const xScale = app.screen.width / app.canvas.clientWidth;

        if (e.buttons) {
            world[e.buttons === 1 ? 'createFood' : 'createHome']({
                x: e.x * xScale - bounds.left,
                y: e.y * yScale - bounds.top,
            });
        }
    };

    (app.canvas as HTMLCanvasElement).addEventListener('mousemove', drop);
    (app.canvas as HTMLCanvasElement).addEventListener('mousedown', drop);

    const pane = new Pane();
    const antsConfig = pane.addFolder({
        title: 'Ants',
    })

    antsConfig.addBinding(config.ant, 'speed', {
        min: 0,
        max: 10,
        step: 1,
        label: 'Speed',
    }).on('change', (e) => {
        for (const ant of world.ants) {
            ant.speed = e.value;
        }
    });

    antsConfig.addBinding(config.ant, 'smellRange', {
        min: 1,
        max: 500,
        step: 1,
        label: 'Smell range',
    }).on('change', (e) => {
        for (const ant of world.ants) {
            ant.smellRange = e.value;
        }
    });

    const markersConfig = pane.addFolder({
        title: 'Markers',
    });
    markersConfig.addBinding(config.marker, 'show', { label: 'Show/Hide' }).on('change', (e) => {
        config.marker.show = e.value as boolean;
    });

    pane.addBinding(config, 'pause').on('change', (e) => {
        if (e.value) {
            app.ticker.stop();
        } else {
            app.ticker.start();
        }
    });

    // pane.addBinding(config, 'blendMode', {
    //     label: 'Blend mode',
    //     options: BLEND_MODES,
    //     value: BLEND_MODES.ADD,
    // }).on('change', (e) => {
    //     world.markersContainer.blendMode = e.value;
    // });

    return () => { };
};
