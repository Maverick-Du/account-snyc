import {Exception, Strategy, StrategyContext, StrategyResult} from "../../../sdk/cognac";

export class StrategyManager {
  strategies: Map<string, Strategy> = new Map()

  load(...strategies: Strategy[]) {
    strategies.forEach(x => this.set(x))
  }

  set(strategy: Strategy) {
    this.strategies.set(strategy.name, strategy)
  }

  get(name: string) {
    let strategy =  this.strategies.get(name)
    if (!strategy) {
      throw new Exception('analyseStrategyNotFound', `strategy is ${name}`)
    }
    return strategy
  }

  has(name: string) {
    return this.strategies.has(name)
  }

  clear() {
    this.strategies.clear()
  }

  async exec<TR extends StrategyResult>(
    name: string,
    ctx: StrategyContext
  ): Promise<TR> {
    const s = this.get(name)
    if (!s) {
      throw new Exception('analyseStrategyNotFound', `strategy is ${name}`)
    }
    return (await s.exec(ctx)) as TR
  }
}
