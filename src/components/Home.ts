import { Application, Graphics } from "pixi.js";
import { World } from "./World";
import { colors } from "../utils";

export class Home extends Graphics {
    constructor(public world: World, public app: Application) {
        super();

        this.beginFill(colors.home);
        this.drawCircle(0, 0, this.size);
        this.endFill();

        this.width = this.height = this.size;
    }

    get size() {
        return 50;
    }
}

