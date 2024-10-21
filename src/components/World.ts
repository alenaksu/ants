import { Application, Container } from 'pixi.js';
import { Ant } from './Ant';
import { Marker } from './Marker';
import { Home } from './Home';
import { Food } from './Food';
import { MarkerMap } from './MarkerMap';
import { Config } from '../types';

export class World {
    ants: Ant[] = [];
    foodMarkerMap: MarkerMap;
    homeMarkerMap: MarkerMap;
    foods: Set<Food> = new Set();
    homes: Set<Home> = new Set();

    container = new Container();

    constructor(public app: Application, public config: Config) {
        this.foodMarkerMap = new MarkerMap(app, config);
        this.homeMarkerMap = new MarkerMap(app, config);

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

    createMarker(type: 'food' | 'home', { x, y, power }: Pick<Marker, 'x' | 'y' | 'power'>) {
        const markerMap = type === 'food' ? this.foodMarkerMap : this.homeMarkerMap;
        markerMap.releaseMarker(x, y, power ?? 0);

        return markerMap.get(x, y)!;
    }

    createFood({ x, y }: { x: number; y: number }) {
        const food = new Food(this, this.app);
        food.x = x;
        food.y = y;
        this.foods.add(food);

        food.on('destroyed', () => {
            this.foods.delete(food);
        });

        this.container.addChild(food);

        return food;
    }

    createHome({ x, y }: { x: number; y: number }) {
        const home = new Home(this, this.app);
        home.x = x;
        home.y = y;
        this.homes.add(home);

        home.on('destroyed', () => {
            this.homes.delete(home);
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
            ant.speed = this.config.ant.speed;
            ant.smellRange = this.config.ant.smellRange;

            return ant;
        });
        this.ants = ants;
    }
}
