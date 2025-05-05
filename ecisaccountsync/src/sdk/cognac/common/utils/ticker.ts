export class Ticker {
  start:number
  constructor() {
    this.start = Date.now()
  }

  end() {
    return Date.now() - this.start
  }
}
