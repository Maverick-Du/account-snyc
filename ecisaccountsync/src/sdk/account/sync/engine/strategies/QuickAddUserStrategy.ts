import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { SyncTask } from '../SyncTask'

export interface IQuickAddUserContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
}

export interface IQuickAddUserResult extends StrategyResult {}

export interface IQuickAddUserStrategy
  extends Strategy<IQuickAddUserContext, IQuickAddUserResult> {}
