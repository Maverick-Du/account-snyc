import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { WPSUser } from '../../was'
import { SyncEngine } from '../SyncEngine'
import {SyncTask} from "../SyncTask";

export interface IBatchDeleteUserContext extends StrategyContext {
  engine: SyncEngine
  users: WPSUser[]
  task: SyncTask
}

export interface IBatchDeleteUserResult extends StrategyResult {}

export interface IBatchDeleteUserStrategy
  extends Strategy<IBatchDeleteUserContext, IBatchDeleteUserResult> {}
