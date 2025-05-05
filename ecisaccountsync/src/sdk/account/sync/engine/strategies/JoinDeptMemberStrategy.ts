import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import {LocalMember} from '../../las'
import {WPSDepartment, WPSUser} from '../../was'
import { SyncEngine } from '../SyncEngine'
import {SyncTask} from "../SyncTask";

export interface IJoinDeptMemberContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
  dept: WPSDepartment
  wu: WPSUser
  user: LocalMember
}

export interface IJoinDeptMemberResult extends StrategyResult {
}

export interface IJoinDeptMemberStrategy
  extends Strategy<IJoinDeptMemberContext, IJoinDeptMemberResult> {}
