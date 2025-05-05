import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import {WpsDeptAndLocalMember} from '../../las'
import { SyncEngine } from '../SyncEngine'
import {SyncTask} from "../SyncTask";

export interface IAddDeptUsersContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
  deptUsers: WpsDeptAndLocalMember[]
}

export interface IAddDeptUsersResult extends StrategyResult {
}

export interface IAddDeptUsersStrategy
  extends Strategy<IAddDeptUsersContext, IAddDeptUsersResult> {}
