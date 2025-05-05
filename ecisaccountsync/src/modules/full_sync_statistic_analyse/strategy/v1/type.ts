import { Strategy, StrategyContext, StrategyResult } from "../../../../sdk/cognac";
import AnalyseSyncTask from "../AnalyseSyncTask";
import { SyncStatisticAnalyseEngine } from "../SyncStatisticAnalyseEngine";

export interface ICollectTableStatisticAnalyseContext extends StrategyContext {
  engine: SyncStatisticAnalyseEngine
  analyseTask: AnalyseSyncTask
}
export interface ICollectTableStatisticAnalyseResult extends StrategyResult { }
export interface ICollectTableStatisticAnalyseStrategy extends Strategy<ICollectTableStatisticAnalyseContext, ICollectTableStatisticAnalyseResult> { }

export interface IUserAddErrorStatisticAnalyseContext extends StrategyContext {
  engine: SyncStatisticAnalyseEngine
  analyseTask: AnalyseSyncTask
}
export interface IUserAddErrorStatisticAnalyseResult extends StrategyResult { }
export interface IUserAddErrorStatisticAnalyseStrategy extends Strategy<IUserAddErrorStatisticAnalyseContext, IUserAddErrorStatisticAnalyseResult> { }

export interface IDeptAddErrorStatisticAnalyseContext extends StrategyContext {
  engine: SyncStatisticAnalyseEngine
  analyseTask: AnalyseSyncTask
}
export interface IDeptAddErrorStatisticAnalyseResult extends StrategyResult { }
export interface IDeptAddErrorStatisticAnalyseStrategy extends Strategy<IDeptAddErrorStatisticAnalyseContext, IDeptAddErrorStatisticAnalyseResult> { }

export interface IDeptUserAddErrorStatisticAnalyseContext extends StrategyContext {
  engine: SyncStatisticAnalyseEngine
  analyseTask: AnalyseSyncTask
}
export interface IDeptUserAddErrorStatisticAnalyseResult extends StrategyResult { }
export interface IDeptUserAddErrorStatisticAnalyseStrategy extends Strategy<IDeptUserAddErrorStatisticAnalyseContext, IDeptUserAddErrorStatisticAnalyseResult> { }

export interface IAddErrorStatisticAnalyseContext extends StrategyContext {
  engine: SyncStatisticAnalyseEngine
  analyseTask: AnalyseSyncTask
}
export interface IAddErrorStatisticAnalyseResult extends StrategyResult { }
export interface IAddErrorStatisticAnalyseStrategy extends Strategy<IAddErrorStatisticAnalyseContext, IAddErrorStatisticAnalyseResult> { }

export interface IUserAddErrorExtra {
  addErrCount: number
  enableSuccessCount: number
  disableSuccessCount: number
  deleteErrCount: number
  updateErrCount: number
  enableErrCount: number
  disableErrCount: number
}

export interface IDeptUserAddErrorExtra {
  addErrCount: number
  deleteErrCount: number
  userOrderOrMianDeptUpdateErrCount: number
}

export interface IDeptAddErrorExtra {
  totalDeptAddError: number
  totalUserUnAdd: number
  deptAddErrCount: number
  childDeptAddErrCount: number
  // updateErrCount: number
  // deleteErrCount: number
  // moveErrCount: number
}