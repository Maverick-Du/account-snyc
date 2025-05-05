import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { SyncTask } from '../SyncTask'
import { WPSDepartment } from '../../was'

export interface IDeleteDepartmentTreeContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
  dept: WPSDepartment
}

export interface IDeleteDepartmentTreeResult extends StrategyResult {}

export interface IDeleteDepartmentTreeStrategy
  extends Strategy<IDeleteDepartmentTreeContext, IDeleteDepartmentTreeResult> {}
