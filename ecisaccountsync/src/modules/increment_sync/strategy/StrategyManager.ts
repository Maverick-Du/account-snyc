import {Exception, Strategy, StrategyContext, StrategyResult} from "../../../sdk/cognac";

export class StrategyManager {
    strategies: Map<string, Strategy> = new Map()

    load(...strategies: Strategy[]) {
        strategies.forEach(x => this.set(x))
    }

    has(name: string) {
        return this.strategies.has(name)
    }

    get(name: string) {
        try {
            return this.strategies.get(name)
        } catch (error) {
            throw new Exception('strategyNotFound', `strategy is ${name}`)
        }
    }

    set(strategy: Strategy) {
        this.strategies.set(strategy.name, strategy)
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
            throw new Exception('strategyNotFound', `strategy is ${name}`)
        }
        return (await s.exec(ctx)) as TR
    }
}
