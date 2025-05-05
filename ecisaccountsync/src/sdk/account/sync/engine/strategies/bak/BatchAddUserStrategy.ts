import {Strategy, StrategyContext, StrategyResult} from "../../../../../cognac";
import { LocalUser } from '../../../las'
import { SyncEngine } from '../../SyncEngine'
import {SyncTask} from "../../SyncTask";

export interface IBatchAddUserContext extends StrategyContext {
  engine: SyncEngine
  users: LocalUser[]
  task: SyncTask
}

export interface IBatchAddUserResult extends StrategyResult {
}

export interface IBatchAddUserStrategy
  extends Strategy<IBatchAddUserContext, IBatchAddUserResult> {}
