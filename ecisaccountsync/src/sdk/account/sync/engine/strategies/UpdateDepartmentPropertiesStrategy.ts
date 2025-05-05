import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { LocalDepartment } from '../../las'
import { WPSDepartment } from '../../was'
import {SyncTask} from "../SyncTask";

export interface IUpdateDepartmentPropertiesContext extends StrategyContext {
  engine: SyncEngine
  dept: WPSDepartment
  from: LocalDepartment
  task: SyncTask
}

export interface IUpdateDepartmentPropertiesResult extends StrategyResult {
  dept: WPSDepartment
}

export interface IUpdateDepartmentPropertiesStrategy
  extends Strategy<IUpdateDepartmentPropertiesContext, IUpdateDepartmentPropertiesResult> {}
