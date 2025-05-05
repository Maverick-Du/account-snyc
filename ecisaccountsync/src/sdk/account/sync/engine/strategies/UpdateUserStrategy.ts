import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { LocalUser } from '../../las'
import { WPSUser } from '../../was'
import { SyncEngine } from '../SyncEngine'
import {SyncTask} from "../SyncTask";

export interface IUpdateUserContext extends StrategyContext {
  engine: SyncEngine
  user:WPSUser
  from:LocalUser
  task: SyncTask
}

export interface IUpdateUserResult extends StrategyResult {
  user?: WPSUser
}

export interface IUpdateUserStrategy
  extends Strategy<IUpdateUserContext, IUpdateUserResult> {}
