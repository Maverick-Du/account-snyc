import {IResult} from "./common";

export interface StrategyContext {}

export interface StrategyResult extends IResult {}

export interface Strategy<
  TC extends StrategyContext = any,
  TR extends StrategyResult = any
> {
  name: string
  exec(ctx: TC): Promise<TR>
}
