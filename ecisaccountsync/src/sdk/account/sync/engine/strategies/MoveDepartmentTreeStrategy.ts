import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { SyncTask } from '../SyncTask'
import { LocalDepartment } from '../../las'
import { WPSDepartment } from '../../was'

export interface IMoveDepartmentTreeContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
  parent:WPSDepartment
  dept: WPSDepartment
  from: LocalDepartment
}

export interface IMoveDepartmentTreeResult extends StrategyResult {}

export interface IMoveDepartmentTreeStrategy
  extends Strategy<IMoveDepartmentTreeContext, IMoveDepartmentTreeResult> {}
