import { Application, Container } from 'pixi.js';
import { Ant } from './Ant';
import { Marker } from './Marker';
import { Home } from './Home';
import { Food } from './Food';
import { MarkerMap } from './MarkerMap';
import { clamp } from '../utils';
import { Config } from '../types';

export class World {
    ants: Ant[] = [];
    foodMarkerMap: MarkerMap;
    homeMarkerMap: MarkerMap;
    foods: Set<Food> = new Set();
    homes: Set<Home> = new Set();

    container = new Container();

    foodMap!: number[];
    homeMap!: number[];

    constructor(public app: Application, public config: Config) {
        this.foodMarkerMap = new MarkerMap(app);
        this.homeMarkerMap = new MarkerMap(app);

        this.foodMap = Array(app.screen.width * app.screen.height * 4).fill(0);
        this.homeMap = Array(app.screen.width * app.screen.height * 4).fill(0);

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
        const markerMap = type === 'food' ? this.foodMarkerMap : this.homeMarkerMap;
        const map = type === 'food' ? this.foodMap : this.homeMap;

        if (permanent) {
            // TODO: markers should not be stored in these maps
            if (!markerMap.has(x, y)) {
                const marker = new Marker(this, this.app, type);
                marker.x = x;
                marker.y = y;
                marker.power = power ?? marker.permanent;
                marker.visible = this.config.marker.show;

                marker.permanent = permanent ?? marker.permanent;
                marker.evaporationRate = evaporationRate ?? marker.evaporationRate;

                markerMap.set(x, y, marker);

                marker.on('destroyed', () => {
                    markerMap.delete(x, y);
                });

                this.drawMarkerOnMap(marker);
            } else {
                const marker = markerMap.get(x, y)!;
                marker.power = clamp(power + marker.power, 0, 2);
            }
        } else {
            this.drawMarkerOnMap({
                x,
                y,
                power: power ?? 0,
                type
            })
        }



        return markerMap.get(x, y)!;
    }

    drawMarkerOnMap(marker: Pick<Marker, 'type' | 'x' | 'y' | 'power'>, radius = 1) {
        const map = marker.type === 'food' ? this.foodMap : this.homeMap;
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const x = Math.floor(marker.x) + dx;
                const y = Math.floor(marker.y) + dy;

                const index = (y * this.app.screen.width + x);

                if (index >= 0 && index < map.length) {
                    map[index] = clamp(marker.power + map[index], 0, 10);
                }
            }
        }
    }

    createFood({ x, y }: { x: number; y: number }) {
        const food = new Food(this, this.app);
        food.x = x;
        food.y = y;
        this.foods.add(food);

        const marker = this.createMarker('food', {
            x,
            y,
            power: 10,
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
            power: 10,
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
            ant.speed = this.config.ant.speed;
            ant.smellRange = this.config.ant.smellRange;

            return ant;
        });
        this.ants = ants;
    }

    evaporateMarkers() {
        for (const marker of this.markers) {
            if (marker.permanent) {
                this.drawMarkerOnMap(marker);
            }
        }
    }

    dissipateMarkers() {
        for (const map of [this.foodMap, this.homeMap]) {
            const width = this.app.screen.width;
            const height = this.app.screen.height;
            const config = this.config;

            const currentMap = Array.from(map);
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const index = (y * width + x);
                    const radius = 1;

                    let average = currentMap[index];

                    for (let dx = -radius; dx <= radius; dx++) {
                        for (let dy = -radius; dy <= radius; dy++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            const neighborIndex = (ny * width + nx);

                            average += currentMap[neighborIndex] ?? 0;
                        }
                    }

                    const total = (radius * 2 + 1) ** 2 + 1;
                    map[index] = (average / total) * config.marker.evaporationRate;
                    if (map[index] < config.marker.evaporationThreshold) {
                        map[index] = 0;
                    }
                }
            }
        }
    }
}
