import { Component } from 'geotic';

export default class Food extends Component {
  declare size: number;

  static properties = {
    size: 10,
  };
}
