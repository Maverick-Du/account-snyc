import { Strategy, StrategyContext, StrategyResult } from './types'
import {Exception} from "./common";
import {SyncStrategyType} from "../account";
import {AddDeptStrategyInterceptor} from "../account/sync/intercept/AddDeptStrategyInterceptor";
import {BatchDeleteUserStrategyInterceptor} from "../account/sync/intercept/BatchDeleteUserStrategyInterceptor";
import {DeleteDeptMemberStrategyInterceptor} from "../account/sync/intercept/DeleteDeptMemberStrategyInterceptor";
import {DeleteDeptStrategyInterceptor} from "../account/sync/intercept/DeleteDeptStrategyInterceptor";
import {DisableUsersStrategyInterceptor} from "../account/sync/intercept/DisableUsersStrategyInterceptor";
import {EnableUsersStrategyInterceptor} from "../account/sync/intercept/EnableUsersStrategyInterceptor";
import {JoinDeptMemberStrategyInterceptor} from "../account/sync/intercept/JoinDeptMemberStrategyInterceptor";
import {MoveDeptStrategyInterceptor} from "../account/sync/intercept/MoveDeptStrategyInterceptor";
import {UpdateUserStrategyInterceptor} from "../account/sync/intercept/UpdateUserStrategyInterceptor";
import {UpdateDeptPropertiesStrategyInterceptor} from "../account/sync/intercept/UpdateDeptPropertiesStrategyInterceptor";
import {UpdateDeptMemberStrategyInterceptor} from "../account/sync/intercept/UpdateDeptMemberStrategyInterceptor";

export class StrategyManager {
  strategies: Map<string, Strategy> = new Map()

  load(...strategies: Strategy[]) {
    for (const strategy of strategies) {
      let s
      switch (strategy.name) {
        case SyncStrategyType.AddDepartment:
          s = new AddDeptStrategyInterceptor();
          s.strategy = strategy
          this.set(s);
          break
        case SyncStrategyType.BatchDeleteUser:
          s = new BatchDeleteUserStrategyInterceptor();
          s.strategy = strategy;
          this.set(s);
          break
        case SyncStrategyType.DeleteDepartmentMember:
          s = new DeleteDeptMemberStrategyInterceptor();
          s.strategy = strategy;
          this.set(s);
          break
        case SyncStrategyType.DeleteDepartment:
          s = new DeleteDeptStrategyInterceptor();
          s.strategy = strategy;
          this.set(s);
          break
        case SyncStrategyType.DisableUsers:
          s = new DisableUsersStrategyInterceptor();
          s.strategy = strategy;
          this.set(s);
          break
        case SyncStrategyType.EnableUsers:
          s = new EnableUsersStrategyInterceptor();
          s.strategy = strategy;
          this.set(s);
          break
        case SyncStrategyType.JoinDepartmentMember:
          s = new JoinDeptMemberStrategyInterceptor();
          s.strategy = strategy;
          this.set(s);
          break
        case SyncStrategyType.MoveDepartment:
          s = new MoveDeptStrategyInterceptor();
          s.strategy = strategy;
          this.set(s);
          break
        case SyncStrategyType.UpdateDepartmentMember:
          s = new UpdateDeptMemberStrategyInterceptor();
          s.strategy = strategy;
          this.set(s);
          break
        case SyncStrategyType.UpdateDepartmentProperties:
          s = new UpdateDeptPropertiesStrategyInterceptor();
          s.strategy = strategy;
          this.set(s);
          break
        case SyncStrategyType.UpdateUser:
          s = new UpdateUserStrategyInterceptor();
          s.strategy = strategy;
          this.set(s);
          break
        default:
          this.set(strategy)
      }
    }
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
    return (await s.exec(ctx)) as TR
  }

  async tryExec(name: string, ctx: StrategyContext) {
    if (this.has(name)) {
      const s = this.get(name)
      await s.exec(ctx)
      return true
    }
    return false
  }
}
