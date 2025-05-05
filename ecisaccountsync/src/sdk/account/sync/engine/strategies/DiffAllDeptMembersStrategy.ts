import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { SyncTask } from '../SyncTask'

export interface IDiffAllDeptMembersContext extends StrategyContext {
  engine: SyncEngine
  task: SyncTask
}

export interface IDiffAllDeptMembersResult extends StrategyResult {}

export interface IDiffAllDeptMembersStrategy
  extends Strategy<IDiffAllDeptMembersContext, IDiffAllDeptMembersResult> {}
