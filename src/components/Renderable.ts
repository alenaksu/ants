import { Component } from 'geotic';

export class Renderable extends Component {
  declare type: 'ant' | 'homeMark' | 'foodMark' | 'food';

  static properties = {
    type: 'ant',
  };
}
