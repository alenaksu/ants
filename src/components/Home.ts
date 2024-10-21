import { Application, Graphics } from "pixi.js";
import { World } from "./World";
import { colors } from "../utils";

export class Home extends Graphics {
    constructor(public world: World, public app: Application) {
        super();

        this.circle(0, 0, this.size / 2);
        this.fill(colors.home);

        this.width = this.height = this.size;
    }

    get size() {
        return 20;
    }
}

