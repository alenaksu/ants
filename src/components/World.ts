import { Application, BLEND_MODES, Container, ParticleContainer, Point } from 'pixi.js';
import { Ant } from './Ant';
import { Marker } from './Marker';
import { Home } from './Home';
import { Food } from './Food';
import { MarkerMap } from './MarkerMap';

export interface Config {
    speed: number;
    antSpeed: number;
    smellRange: number;
    pause: boolean;
    blendMode: BLEND_MODES;
    showMarkers: boolean;
}

export class World {
    ants: Ant[] = [];
    foodMarkerMap: MarkerMap;
    homeMarkerMap: MarkerMap;
    foods: Set<Food> = new Set();
    homes: Set<Home> = new Set();

    container = new Container();
    markersContainer: ParticleContainer;

    constructor(public app: Application, public config: Config) {
        this.foodMarkerMap = new MarkerMap(app);
        this.homeMarkerMap = new MarkerMap(app);

        this.markersContainer = new ParticleContainer(
            this.app.view.width * this.app.view.height,
            {
                alpha: true,
                position: false,
                rotation: false,
                scale: true,
                tint: false,
                uvs: false,
                vertices: false,
            },
            // 20_000,
            // true
        );

        this.markersContainer.blendMode = config.blendMode;
        app.stage.addChild(this.markersContainer);
        app.stage.addChild(this.container);
    }

    *getMarkers() {
        for (const marker of this.foodMarkerMap.getAll()) {
            yield marker;
        }

        for (const marker of this.homeMarkerMap.getAll()) {
            yield marker;
        }
    }

    get markers() {
        return this.getMarkers();
    }

    createMarker(
        type: 'food' | 'home',
        {
            x,
            y,
            power,
            evaporationRate,
            permanent,
        }: Pick<Marker, 'x' | 'y' | 'power'> &
            Partial<Pick<Marker, 'power' | 'evaporationRate' | 'permanent'>>
    ) {
        const map = type === 'food' ? this.foodMarkerMap : this.homeMarkerMap;

        if (!map.has(x, y)) {
            const marker = new Marker(this, this.app, type);
            marker.x = x;
            marker.y = y;
            marker.power = power ?? marker.permanent;
            marker.visible = this.config.showMarkers;

            marker.permanent = permanent ?? marker.permanent;
            marker.evaporationRate = evaporationRate ?? marker.evaporationRate;

            map.set(x, y, marker);

            marker.on('destroyed', () => {
                map.delete(x, y);
            });

            this.markersContainer.addChild(marker);
        } else {
            const marker = map.get(x, y)!;
            marker.power = marker.power + power;
        }

        return map.get(x, y)!;
    }

    createFood({ x, y }: { x: number; y: number }) {
        const food = new Food(this, this.app);
        food.x = x;
        food.y = y;
        this.foods.add(food);

        const marker = this.createMarker('food', {
            x,
            y,
            power: Infinity,
            permanent: true,
        });

        food.on('destroyed', () => {
            this.foods.delete(food);

            if (!marker.destroyed) {
                marker.destroy();
            }
        });

        this.container.addChild(food);

        return food;
    }

    createHome({ x, y }: { x: number; y: number }) {
        const home = new Home(this, this.app);
        home.x = x;
        home.y = y;
        this.homes.add(home);

        const marker = this.createMarker('home', {
            x,
            y,
            power: Infinity,
            permanent: true,
        });

        home.on('destroyed', () => {
            this.homes.delete(home);
            marker.destroy();
        });

        this.container.addChild(home);

        return home;
    }

    createAnt({ x, y, rotation }: { x: number; y: number; rotation: number }) {
        const ant = new Ant(this, this.app);
        ant.x = x;
        ant.y = y;
        ant.rotation = rotation;

        this.container.addChild(ant);

        return ant;
    }

    createColony(count: number, { x, y }: Pick<Ant, 'x' | 'y'>) {
        this.ants.forEach((ant) => ant.destroy());

        this.createHome({
            x,
            y,
        });

        const ants = Array.from({ length: count }, () => {
            const ant = this.createAnt({
                x,
                y,
                rotation: Math.PI * 2 * Math.random(),
            });
            ant.speed = this.config.antSpeed;
            ant.smellRange = this.config.smellRange;

            return ant;
        });
        this.ants = ants;
    }
}
