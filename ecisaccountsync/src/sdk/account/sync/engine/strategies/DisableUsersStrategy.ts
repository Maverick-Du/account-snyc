import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { WPSUser } from '../../was'
import { SyncEngine } from '../SyncEngine'
import {SyncTask} from "../SyncTask";

export interface IDisableUsersContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
  users: WPSUser[]
  msg: string
}

export interface IDisableUsersResult extends StrategyResult {
}

export interface IDisableUsersStrategy
  extends Strategy<IDisableUsersContext, IDisableUsersResult> {}
