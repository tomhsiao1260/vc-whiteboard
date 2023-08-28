import EventEmitter from './EventEmitter';

export default class Time extends EventEmitter {
  constructor() {
    super()
  }

  tick() {
    this.trigger('tick')
  }
}
