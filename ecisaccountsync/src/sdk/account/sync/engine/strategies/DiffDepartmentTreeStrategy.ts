import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { SyncTask } from '../SyncTask'
import { LocalDepartment } from '../../las'
import { WPSDepartment } from '../../was'

export interface IDiffDepartmentTreeContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
  src: LocalDepartment
  dist: WPSDepartment
}

export interface IDiffDepartmentTreeResult extends StrategyResult {}

export interface IDiffDepartmentTreeStrategy
  extends Strategy<IDiffDepartmentTreeContext, IDiffDepartmentTreeResult> {}
