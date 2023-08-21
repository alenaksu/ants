import { Component } from 'geotic';

export default class Marker extends Component {
  declare lifespan: number;
  declare type: 'toHome' | 'toFood';

  static properties = {
    lifespan: 20_000,
    type: '',
  };
}
