import { CompanyCfg, V7AccountSystem } from "../../../sdk/account";
import { FullSyncStatisticAnalyseSrv, fullSyncStatisticAnalyseSrv } from "../../service/FullSyncStatisticAnalyseSrv";
import { StrategyManager } from "../strategy/StrategyManager";
import { SyncStatisticAnalyseEngine } from "../strategy/SyncStatisticAnalyseEngine";
import { WPS4Context } from "../../../sdk/common/wps4";
import fullSyncTaskService from "../../service/FullSyncTaskService";
import AnalyseSyncTask from "../strategy/AnalyseSyncTask";
import { AnalyseCommonErrName, AnalyseTaskStopError } from "../strategy/type";
import { FullSyncStatisticAnalyseStatus } from "../../db/types";
import {
  SyncUserAddErrorStatisticAnalyseStrategy,
  SyncAddErrorStatisticAnalyseStrategy,
  SyncCollectTableStatisticAnalyseStrategy,
  SyncDeptAddErrorStatisticAnalyseStrategy,
  SyncDeptUserAddErrorStatisticAnalyseStrategy
} from "../strategy/v1";
import {IDatabase} from "../../../sdk/cognac/orm";
import { log } from "../../../sdk/cognac";

export default class FullSyncAnalyseContext {
  was: V7AccountSystem
  las: FullSyncStatisticAnalyseSrv
  strategies: StrategyManager
  engine: SyncStatisticAnalyseEngine

  init(options: {ctx: WPS4Context, db: IDatabase}) {
    const { ctx, db } = options
    this.was = new V7AccountSystem(ctx, db)
    this.las = fullSyncStatisticAnalyseSrv
    this.strategies = new StrategyManager()
    this.setup()
    this.engine = new SyncStatisticAnalyseEngine(this.was, this.las, this.strategies)
  }

  // 开始统计分析
  async start(taskId: string, cfg: CompanyCfg) {
    let originTaskId = fullSyncTaskService.getOriginTaskId(taskId)
    let addErrRecordList = await this.las.getFullSyncErrAnalyseAllRecordList(cfg.companyId, taskId)
    let errRecords = addErrRecordList.map(record => `${record.sync_tb_type}_${record.operate_type}_${record.err_type}`)
    const analyseTask = new AnalyseSyncTask(this.engine, taskId, originTaskId, cfg, errRecords)
    try {
      await this.engine.start(analyseTask)
      // 统计分析任务成功结束
      analyseTask.status = FullSyncStatisticAnalyseStatus.ANALYSE_SUCCESS
    } catch (err) {
      if (err instanceof AnalyseTaskStopError) {
        log.i({info: `full sync statistic analyse ${taskId} exit. reason: ${err.message}`})
        if (err.name === AnalyseCommonErrName.AnalyseStop) {
          analyseTask.status = FullSyncStatisticAnalyseStatus.ANALYSE_STOP
        }
      } else {
        let msg = `full sync statistic analyse ${taskId} error. reason: ${err.message}`
        analyseTask.msg = msg
        err.msg = msg
        log.error(err)
        analyseTask.status = FullSyncStatisticAnalyseStatus.ANALYSE_FAIL
        // 分析出现失败情况下，内存中该分析任务终止map需要清空
        this.las.clearStatisticAnalyse(taskId, cfg.companyId)
      }
    } finally {
      await this.las.updateFullSyncTaskAnalyseRecord(analyseTask.cfg.companyId, analyseTask.taskId, analyseTask.status, analyseTask.msg)
    }
  }

  setup() {
    this.strategies.load(
      new SyncCollectTableStatisticAnalyseStrategy(),
      new SyncAddErrorStatisticAnalyseStrategy(),
      new SyncUserAddErrorStatisticAnalyseStrategy(),
      new SyncDeptAddErrorStatisticAnalyseStrategy(),
      new SyncDeptUserAddErrorStatisticAnalyseStrategy()
    )
  }
}
