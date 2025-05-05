import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import {LocalDepartment, LocalDeptAndWpsDept} from '../../las'
import { WPSDepartment } from '../../was'
import {SyncTask} from "../SyncTask";

export interface IUpdateDepartmentLeadersContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
  depts: LocalDeptAndWpsDept[]
}

export interface IUpdateDepartmentLeadersResult extends StrategyResult {
}

export interface IUpdateDepartmentLeadersStrategy
  extends Strategy<IUpdateDepartmentLeadersContext, IUpdateDepartmentLeadersResult> {}
