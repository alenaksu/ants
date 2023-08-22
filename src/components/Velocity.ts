import { Component } from "geotic";

export default class Velocity extends Component {
    declare speed: number;
    declare direction: number;
    declare rotationFactor: number;

    static properties = {
        speed: 0,
        direction: 0,
        rotationFactor: 0.4,
    };
}
