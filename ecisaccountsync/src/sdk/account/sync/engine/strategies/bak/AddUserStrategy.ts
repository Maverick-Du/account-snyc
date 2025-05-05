import {Strategy, StrategyContext, StrategyResult} from "../../../../../cognac";
import { LocalUser } from '../../../las'
import { WPSUser } from '../../../was'
import { SyncEngine } from '../../SyncEngine'
import {SyncTask} from "../../SyncTask";

export interface IAddUserContext extends StrategyContext {
  engine: SyncEngine
  from: LocalUser
  task: SyncTask
}

export interface IAddUserResult extends StrategyResult {
  user: WPSUser
}

export interface IAddUserStrategy
  extends Strategy<IAddUserContext, IAddUserResult> {}
