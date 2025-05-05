import { log, Ticker } from "../../../../sdk/cognac";
import { StatisticAnalyseTbToOperateMap, StatisticAnalyseTbType, StatisticAnalyseTbToErrTypeMap } from "../../../db/types";
import AnalyseSyncTask from "../AnalyseSyncTask";
import { SyncStatisticAnalyseEngine } from "../SyncStatisticAnalyseEngine";
import { SyncAnalyseStrategyType } from "../type";
import { IAddErrorStatisticAnalyseContext, IAddErrorStatisticAnalyseStrategy, IAddErrorStatisticAnalyseResult } from "./type";

export class SyncAddErrorStatisticAnalyseStrategy implements IAddErrorStatisticAnalyseStrategy {
  name:string = SyncAnalyseStrategyType.FullSyncAddErrorStatisticAnalyse
  async exec(ctx: IAddErrorStatisticAnalyseContext): Promise<IAddErrorStatisticAnalyseResult> {
    const { engine, analyseTask } = ctx
    // 判断是否需要停止统计分析
    engine.las.checkStatisticAnalyseIdNeedStop(analyseTask.taskId, analyseTask.cfg.companyId)

    const tiker = new Ticker()

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} addErrorStatisticAnalyse start`,
    })

    await this.analyseUserRecordErr(engine, analyseTask)
    engine.las.checkStatisticAnalyseIdNeedStop(analyseTask.taskId, analyseTask.cfg.companyId)
    await this.analyseDeptUserRecordErr(engine, analyseTask)
    engine.las.checkStatisticAnalyseIdNeedStop(analyseTask.taskId, analyseTask.cfg.companyId)
    await this.analyseDeptRecordErr(engine, analyseTask)

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} addErrorStatisticAnalyse success[${tiker.end()}]`,
    })
    return { code: 'ok' }
  }

  async analyseUserRecordErr(engine: SyncStatisticAnalyseEngine, analyseTask: AnalyseSyncTask) {
    const userUpdateTypes = StatisticAnalyseTbToOperateMap.get(StatisticAnalyseTbType.User)
    if (!userUpdateTypes) {
      return
    }
    for (const updateType of userUpdateTypes) {
      const errTypes = StatisticAnalyseTbToErrTypeMap.get(StatisticAnalyseTbType.User)
      if (!errTypes) {
        continue
      }
      for (const errType of errTypes) {
        // 判断是否已统计分析过
        const recordKey = `${StatisticAnalyseTbType.User}_${updateType}_${errType}`
        if (analyseTask.hasRecord(recordKey)) {
          continue
        }
        const count = await engine.las.queryUserAnalyseRecordErrCount(analyseTask.taskId, updateType, errType)
        if ( count <= 0) {
          continue
        }
        // 将获取信息存入错误信息统计分析表中
        await engine.las.addFullSyncErrAnalyseRecord({
          task_id: analyseTask.taskId,
          company_id: analyseTask.cfg.companyId,
          sync_tb_type: StatisticAnalyseTbType.User,
          operate_type: updateType,
          err_type: errType,
          count: count
        })
      }
    }
  }

  async analyseDeptUserRecordErr(engine: SyncStatisticAnalyseEngine, analyseTask: AnalyseSyncTask) {
    const deptUserErrs = StatisticAnalyseTbToOperateMap.get(StatisticAnalyseTbType.DeptUser)
    if (!deptUserErrs) {
      return
    }
    for (const updateType of deptUserErrs) {
      const errTypes = StatisticAnalyseTbToErrTypeMap.get(StatisticAnalyseTbType.DeptUser)
      if (!errTypes) {
        continue
      }
      for (const errType of errTypes) {
        // 判断是否已统计分析过
        const recordKey = `${StatisticAnalyseTbType.DeptUser}_${updateType}_${errType}`
        if (analyseTask.hasRecord(recordKey)) {
          continue
        }
        const count = await engine.las.queryDeptUserAnalyseRecordErrCount(analyseTask.taskId, updateType, errType)
        if ( count <= 0) {
          continue
        }
        // 将获取信息存入错误信息统计分析表中
        await engine.las.addFullSyncErrAnalyseRecord({
          task_id: analyseTask.taskId,
          company_id: analyseTask.cfg.companyId,
          sync_tb_type: StatisticAnalyseTbType.DeptUser,
          operate_type: updateType,
          err_type: errType,
          count: count
        })
      }
    }
  }

  async analyseDeptRecordErr(engine: SyncStatisticAnalyseEngine, analyseTask: AnalyseSyncTask) {
    const deptErrs = StatisticAnalyseTbToOperateMap.get(StatisticAnalyseTbType.Dept)
    if (!deptErrs) {
      return
    }
    for (const updateType of deptErrs) {
      const errTypes = StatisticAnalyseTbToErrTypeMap.get(StatisticAnalyseTbType.Dept)
      if (!errTypes) {
        continue
      }
      for (const errType of errTypes) {
        // 判断是否已统计分析过
        const recordKey = `${StatisticAnalyseTbType.Dept}_${updateType}_${errType}`
        if (analyseTask.hasRecord(recordKey)) {
          continue
        }
        const count = await engine.las.queryDeptAnalyseRecordErrCount(analyseTask.taskId, updateType, errType)
        if ( count <= 0) {
          continue
        }
        // 将获取信息存入错误信息统计分析表中
        await engine.las.addFullSyncErrAnalyseRecord({
          task_id: analyseTask.taskId,
          company_id: analyseTask.cfg.companyId,
          sync_tb_type: StatisticAnalyseTbType.Dept,
          operate_type: updateType,
          err_type: errType,
          count: count
        })
      }
    }
  }
}
