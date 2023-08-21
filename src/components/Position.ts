import { Component } from 'geotic';

export default class Position extends Component {
  declare x: number;
  declare y: number;

  static properties = {
    x: 0,
    y: 0,
  };
}
