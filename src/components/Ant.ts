import { Component } from 'geotic';

export default class Ant extends Component {
  declare state: 'exploring' | 'carrying_food';
  declare markerFrequency: number;
  declare smellRange: number;

  static properties = {
    state: 'exploring',
    markerFrequency: 1_000,
    smellRange: 50,
  };
}
