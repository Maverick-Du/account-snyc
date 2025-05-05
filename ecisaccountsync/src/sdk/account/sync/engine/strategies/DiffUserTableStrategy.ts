import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { SyncTask } from '../SyncTask'

export interface IDiffUserTableContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
}

export interface IDiffUserTableResult extends StrategyResult {}

export interface IDiffUserTableStrategy
  extends Strategy<IDiffUserTableContext, IDiffUserTableResult> {}
