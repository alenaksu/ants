import { Component } from "geotic";

export default class Decay extends Component {
    declare rate: number;

    static properties = {
        rate: 0.999,
    };
}
