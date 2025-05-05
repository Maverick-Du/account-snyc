import {Strategy, StrategyContext, StrategyResult} from "../../../../../cognac";
import { WPSUser } from '../../../was'
import { SyncEngine } from '../../SyncEngine'
import {SyncTask} from "../../SyncTask";

export interface IDeleteUserContext extends StrategyContext {
  engine: SyncEngine
  user: WPSUser
  task: SyncTask
}

export interface IDeleteUserResult extends StrategyResult {}

export interface IDeleteUserStrategy
  extends Strategy<IDeleteUserContext, IDeleteUserResult> {}
