import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import {LocalMember} from '../../las'
import {WPSDepartment, WPSMember} from '../../was'
import {SyncTask} from "../SyncTask";

export interface IUpdateDeptMemberContext extends StrategyContext {
  engine: SyncEngine,
  task: SyncTask,
  dept: WPSDepartment,
  user: WPSMember,
  from: LocalMember,
}

export interface IUpdateDeptMemberResult extends StrategyResult {}

export interface IUpdateDeptMemberStrategy
  extends Strategy<IUpdateDeptMemberContext, IUpdateDeptMemberResult> {}
