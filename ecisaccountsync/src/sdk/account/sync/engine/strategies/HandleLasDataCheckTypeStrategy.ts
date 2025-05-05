import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { SyncTask } from '../SyncTask'

export interface IHandleLasDataCheckTypeContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
}

export interface IHandleLasDataCheckTypeResult extends StrategyResult {}

export interface IHandleLasDataCheckTypeStrategy
  extends Strategy<IHandleLasDataCheckTypeContext, IHandleLasDataCheckTypeResult> {}
