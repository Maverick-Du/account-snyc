import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import {WPSDepartment, WPSUser} from '../../was'
import {SyncTask} from "../SyncTask";

export interface IDeleteDepartmentMemberContext extends StrategyContext {
  engine: SyncEngine,
  task: SyncTask,
  root: WPSDepartment,
  dept: WPSDepartment,
  user: WPSUser,
  diffRootMember: boolean
}

export interface IDeleteDepartmentMemberResult extends StrategyResult {
  message: string
}

export interface IDeleteDepartmentMemberStrategy
  extends Strategy<IDeleteDepartmentMemberContext, IDeleteDepartmentMemberResult> {}
