import {Strategy, StrategyContext, StrategyResult} from "../../../../../cognac";
import { WPSUser } from '../../../was'
import { SyncEngine } from '../../SyncEngine'
import {SyncTask} from "../../SyncTask";
import {LocalUser} from "../../../las";

export interface IBatchUpdateUserContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
  mapArray: { user: WPSUser; from: LocalUser }[]
}

export interface IBatchUpdateUserResult extends StrategyResult {}

export interface IBatchUpdateUserStrategy
  extends Strategy<IBatchUpdateUserContext, IBatchUpdateUserResult> {}
