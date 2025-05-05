import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { SyncTask } from '../SyncTask'

export interface IUpdateUserLeaderContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
}

export interface IUpdateUserLeaderResult extends StrategyResult {}

export interface IUpdateUserLeaderStrategy
  extends Strategy<IUpdateUserLeaderContext, IUpdateUserLeaderResult> {}
