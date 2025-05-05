import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { WPSUser } from '../../was'
import { SyncEngine } from '../SyncEngine'
import {SyncTask} from "../SyncTask";

export interface IEnableUsersContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
  users: WPSUser[]
}

export interface IEnableUsersResult extends StrategyResult {
}

export interface IEnableUsersStrategy
  extends Strategy<IEnableUsersContext, IEnableUsersResult> {}
