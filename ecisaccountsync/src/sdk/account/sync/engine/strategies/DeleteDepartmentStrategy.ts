import {Strategy, StrategyContext, StrategyResult} from "../../../../cognac";
import { SyncEngine } from '../SyncEngine'
import { WPSDepartment } from '../../was'
import {SyncTask} from "../SyncTask";

export interface IDeleteDepartmentContext extends StrategyContext {
  engine: SyncEngine
  dept: WPSDepartment
  task: SyncTask
}

export interface IDeleteDepartmentResult extends StrategyResult {}

export interface IDeleteDepartmentStrategy
  extends Strategy<IDeleteDepartmentContext, IDeleteDepartmentResult> {}
