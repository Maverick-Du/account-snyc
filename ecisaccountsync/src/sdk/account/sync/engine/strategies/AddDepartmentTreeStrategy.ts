import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { SyncTask } from '../SyncTask'
import { LocalDepartment } from '../../las'
import { WPSDepartment } from '../../was'

export interface IAddDepartmentTreeContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
  parent:WPSDepartment
  dept: LocalDepartment
}

export interface IAddDepartmentTreeResult extends StrategyResult {}

export interface IAddDepartmentTreeStrategy
  extends Strategy<IAddDepartmentTreeContext, IAddDepartmentTreeResult> {}
