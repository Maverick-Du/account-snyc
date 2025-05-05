import { FullSyncUpdateType, RecordStatus, StatisticAnalyseErrType, StatisticAnalyseOperateType, StatisticAnalyseTbType } from "../../../db/types";
import { SyncAnalyseStrategyType } from "../type";
import { IDeptUserAddErrorStatisticAnalyseStrategy, IDeptUserAddErrorStatisticAnalyseContext, IDeptUserAddErrorStatisticAnalyseResult, IDeptUserAddErrorExtra } from "./type";

export class SyncDeptUserAddErrorStatisticAnalyseStrategy implements IDeptUserAddErrorStatisticAnalyseStrategy {
  name: string = SyncAnalyseStrategyType.FullyncDeptUserAddErrorStatisticAnalyse
  async exec(ctx: IDeptUserAddErrorStatisticAnalyseContext): Promise<IDeptUserAddErrorStatisticAnalyseResult> {
    const { engine, analyseTask } = ctx
    // 判断是否需要停止统计分析
    engine.las.checkStatisticAnalyseIdNeedStop(analyseTask.taskId, analyseTask.cfg.companyId)

    // 判断数据是否已经存在
    let recordKey = `${StatisticAnalyseTbType.DeptUser}_${StatisticAnalyseOperateType.DeptUserAdd}_${StatisticAnalyseErrType.DeptUserAddErrorCount}`
    if (analyseTask.hasRecord(recordKey)) {
      return { code: 'ok' }
    }

    // 获取全量同步部门用户关系记录表中 创建部门用户关系失败的记录数
    let deptUserAddErrCount = await engine.las.getFullSyncDeptUserRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.UserDeptAdd)
    let deptUserDeleteErrCount = await engine.las.getFullSyncDeptUserRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.UserDeptDel)
    // let userOrderUpdateErrCount = await engine.las.getFullSyncDeptUserRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.UserOrderUpdate)
    // let mainDeptUpdateErrCount = await engine.las.getFullSyncDeptUserRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.MainDeptUpdate)
    let userOrderOrMianDeptUpdateErrCount = await engine.las.getFullSyncDeptUserRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.UserOrderOrMainDeptUpdate)
    // 将获取信息存入错误信息统计分析表中
    let extra: IDeptUserAddErrorExtra = {
      addErrCount: deptUserAddErrCount,
      deleteErrCount: deptUserDeleteErrCount,
      userOrderOrMianDeptUpdateErrCount: userOrderOrMianDeptUpdateErrCount
    }
    let extraJsonStr = JSON.stringify(extra)
    await engine.las.addFullSyncErrAnalyseRecord({
      task_id: analyseTask.taskId,
      company_id: analyseTask.cfg.companyId,
      sync_tb_type: StatisticAnalyseTbType.DeptUser,
      operate_type: StatisticAnalyseOperateType.DeptUserAdd,
      err_type: StatisticAnalyseErrType.DeptUserAddErrorCount,
      extra: extraJsonStr
    })
    return { code: 'ok' }
  }
}