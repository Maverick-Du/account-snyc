import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { LocalDepartment } from '../../las'
import { WPSDepartment } from '../../was'
import {SyncTask} from "../SyncTask";

export interface IUpdateDepartmentContext extends StrategyContext {
  engine: SyncEngine
  dept: WPSDepartment
  from: LocalDepartment
  task: SyncTask
}

export interface IUpdateDepartmentResult extends StrategyResult {}

export interface IUpdateDepartmentStrategy
  extends Strategy<IUpdateDepartmentContext, IUpdateDepartmentResult> {}
