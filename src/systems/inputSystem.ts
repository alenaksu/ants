import { World } from '../components/World';
import { Pane } from 'tweakpane';
import { Config, System } from '../types';

export const createInputSystem: System = (world: World, config: Config) => {
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    const app = world.app;
    const drop = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const bounds = app.canvas.getBoundingClientRect();

        if (e.buttons) {
            world[e.buttons === 1 ? 'createFood' : 'createHome']({
                x: ((e.clientX - bounds.left) / bounds.width) * app.screen.width,
                y: ((e.clientY - bounds.top) / bounds.height) * app.screen.height,
            });
        }
    };

    (app.canvas as HTMLCanvasElement).addEventListener('mousemove', drop);
    (app.canvas as HTMLCanvasElement).addEventListener('mousedown', drop);

    const pane = new Pane();
    const monitor = { fps: 0 };

    // --- Simulation folder ---
    const simConfig = pane.addFolder({ title: 'Simulation' });

    simConfig.addBinding(monitor, 'fps', { readonly: true, label: 'FPS' });

    simConfig.addBinding(config, 'scale', {
        min: 0.1,
        max: 1,
        step: 0.1,
        label: 'Scale',
    }).on('change', (e) => {
        const newW = Math.floor(window.innerWidth * e.value);
        const newH = Math.floor(window.innerHeight * e.value);
        app.renderer.resize(newW, newH);
        world.reset();
        world.createColony(config.antCount, { x: newW / 2, y: newH / 2 });
    });

    simConfig.addBinding(config, 'pause').on('change', (e) => {
        if (e.value) {
            app.ticker.stop();
        } else {
            app.ticker.start();
        }
    });

    // --- Ants folder ---
    const antsConfig = pane.addFolder({ title: 'Ants' });

    antsConfig.addBinding(config, 'antCount', {
        min: 1,
        max: 2000,
        step: 1,
        label: 'Count',
    }).on('change', (_e) => {
        world.reset();
        world.createColony(config.antCount, {
            x: app.screen.width / 2,
            y: app.screen.height / 2,
        });
    });

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

    // --- Markers folder ---
    const markersConfig = pane.addFolder({ title: 'Markers' });
    markersConfig.addBinding(config.marker, 'show', { label: 'Show/Hide' }).on('change', (e) => {
        world.foodMarkerMap.mapSprite.visible = e.value as boolean;
        world.homeMarkerMap.mapSprite.visible = e.value as boolean;
    });

    return (ticker) => {
        monitor.fps = Math.round(ticker.FPS);
        pane.refresh();
    };
};
