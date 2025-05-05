import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { LocalDepartment } from '../../las'
import { WPSDepartment } from '../../was'
import {SyncTask} from "../SyncTask";

export interface IDiffDepartmentMembersContext extends StrategyContext {
  engine: SyncEngine
  dept: WPSDepartment
  from: LocalDepartment
  task: SyncTask
  diffRootMember: boolean
}

export interface IDiffDepartmentMembersResult extends StrategyResult {}

export interface IDiffDepartmentMembersStrategy
  extends Strategy<IDiffDepartmentMembersContext, IDiffDepartmentMembersResult> {}
