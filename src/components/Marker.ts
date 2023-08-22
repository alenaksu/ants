import { Component } from "geotic";

export default class Marker extends Component {
    declare type: "toHome" | "toFood";
    declare power: number;

    static properties = {
        power: 1,
        type: "",
    };
}
