import { Application } from 'pixi.js';
import { Marker } from './Marker';

export class MarkerMap {
    private map = new Map<number, Marker>();

    constructor(private app: Application) {}

    private getIndex(x: number, y: number) {
        return y * this.app.view.width + x;
    }

    set(x: number, y: number, value: Marker): this {
        this.map.set(this.getIndex(x, y), value);

        return this;
    }

    get(x: number, y: number): Marker | undefined {
        return this.map.get(this.getIndex(x, y));
    }

    has(x: number, y: number): boolean {
        return this.map.has(this.getIndex(x, y));
    }

    delete(x: number, y: number): boolean {
        return this.map.delete(this.getIndex(x, y));
    }

    getAll(): IterableIterator<Marker> {
        return this.map.values();
    }
}
