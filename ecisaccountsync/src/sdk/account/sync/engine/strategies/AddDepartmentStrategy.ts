import { SyncEngine } from '../SyncEngine'
import { LocalDepartment } from '../../las'
import { WPSDepartment } from '../../was'
import {SyncTask} from "../SyncTask";
import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";

export interface IAddDepartmentContext extends StrategyContext {
  engine: SyncEngine
  parent:WPSDepartment
  dept: LocalDepartment
  task: SyncTask
}

export interface IAddDepartmentResult extends StrategyResult {
  dept:WPSDepartment
}

export interface IAddDepartmentStrategy
  extends Strategy<IAddDepartmentContext, IAddDepartmentResult> {}
