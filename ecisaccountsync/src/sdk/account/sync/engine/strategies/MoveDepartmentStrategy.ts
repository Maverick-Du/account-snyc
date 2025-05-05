import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { WPSDepartment } from '../../was'
import {SyncTask} from "../SyncTask";

export interface IMoveDepartmentContext extends StrategyContext {
  engine: SyncEngine
  parent:WPSDepartment
  dept: WPSDepartment
  task: SyncTask
}

export interface IMoveDepartmentResult extends StrategyResult {}

export interface IMoveDepartmentStrategy
  extends Strategy<IMoveDepartmentContext, IMoveDepartmentResult> {}
