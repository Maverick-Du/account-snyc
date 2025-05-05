import { log, Ticker } from "../../../../sdk/cognac";
import { FullSyncUpdateType, RecordStatus, StatisticAnalyseErrType, StatisticAnalyseOperateType, StatisticAnalyseTbType } from "../../../db/types";
import { SyncAnalyseStrategyType } from "../type";
import { IUserAddErrorStatisticAnalyseStrategy, IUserAddErrorStatisticAnalyseContext, IUserAddErrorStatisticAnalyseResult, IUserAddErrorExtra } from "./type";

export class SyncUserAddErrorStatisticAnalyseStrategy implements IUserAddErrorStatisticAnalyseStrategy {
  name: string = SyncAnalyseStrategyType.FullSyncUserAddErrorStatisticAnalyse
  async exec(ctx: IUserAddErrorStatisticAnalyseContext): Promise<IUserAddErrorStatisticAnalyseResult> {
    const { engine, analyseTask } = ctx
    // 判断是否需要停止统计分析
    engine.las.checkStatisticAnalyseIdNeedStop(analyseTask.taskId, analyseTask.cfg.companyId)

    // 判断数据是否已经存在
    let recordKey = `${StatisticAnalyseTbType.User}_${StatisticAnalyseOperateType.UserAdd}_${StatisticAnalyseErrType.UserAddErrorCount}`
    if (analyseTask.hasRecord(recordKey)) {
      return { code: 'ok' }
    }

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} userAddError start`,
    })

    const ticker = new Ticker()

    // 获取全量同步用户记录表中，用户创建失败数据
    let addErrCount = await engine.las.getFullSyncUserRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.UserAdd)

    let deleteErrCount = await engine.las.getFullSyncUserRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.UserDel)

    let updateErrCount = await engine.las.getFullSyncUserRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.UserUpdate)

    let enableErrCount = await engine.las.getFullSyncUserRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.UserEnable)

    let disableErrCount = await engine.las.getFullSyncUserRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.UserDisable)

    let enableSuccessCount = await engine.las.getFullSyncUserRecordListCount(analyseTask.taskId, RecordStatus.SUCCESS, FullSyncUpdateType.UserEnable)

    let disableSuccessCount = await engine.las.getFullSyncUserRecordListCount(analyseTask.taskId, RecordStatus.SUCCESS, FullSyncUpdateType.UserDisable)

    log.i({ info: `full sync statistic analyse ${analyseTask.taskId} userError getFullSyncDeptUserRecordListCount success[${ticker.end()}]` })

    // 将获取信息存入错误信息统计分析表中
    let extra: IUserAddErrorExtra = {
      addErrCount: addErrCount,
      deleteErrCount: deleteErrCount,
      updateErrCount: updateErrCount,
      enableSuccessCount: enableSuccessCount,
      disableSuccessCount: disableSuccessCount,
      enableErrCount: enableErrCount,
      disableErrCount: disableErrCount
    }
    let extraJsonStr = JSON.stringify(extra)
    await engine.las.addFullSyncErrAnalyseRecord({
      task_id: analyseTask.taskId,
      company_id: analyseTask.cfg.companyId,
      sync_tb_type: StatisticAnalyseTbType.User,
      operate_type: StatisticAnalyseOperateType.UserAdd,
      err_type: StatisticAnalyseErrType.UserAddErrorCount,
      extra: extraJsonStr
    })

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} userAddError success[${ticker.end()}]`,
    })

    return { code: 'ok' }
  }
}
