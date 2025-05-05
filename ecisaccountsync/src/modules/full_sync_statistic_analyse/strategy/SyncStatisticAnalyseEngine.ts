import { V7AccountSystem } from '../../../sdk/account'
import { StrategyManager } from './StrategyManager'
import { FullSyncStatisticAnalyseSrv } from '../../service/FullSyncStatisticAnalyseSrv'
import AnalyseSyncTask from './AnalyseSyncTask'
import { SyncAnalyseActionType, SyncAnalyseStrategyType } from './type'
import {
  IDeptAddErrorStatisticAnalyseContext,
  IAddErrorStatisticAnalyseContext,
  ICollectTableStatisticAnalyseContext,
  IDeptUserAddErrorStatisticAnalyseContext,
  IUserAddErrorStatisticAnalyseContext,
  ICollectTableStatisticAnalyseResult
} from './v1/type'
import {check, Exception, log, Ticker} from "../../../sdk/cognac";

export class SyncStatisticAnalyseEngine {
  was: V7AccountSystem = null
  las: FullSyncStatisticAnalyseSrv = null
  sm: StrategyManager = null

  constructor(was: V7AccountSystem, las: FullSyncStatisticAnalyseSrv, sm: StrategyManager) {
    this.was = was
    this.las = las
    this.sm = sm
  }

  async start(analyseTask: AnalyseSyncTask) {
    analyseTask.preSet([
      { name: SyncAnalyseActionType.FullSyncAddErrorStatisticAnalyse },
      // { name: SyncAnalyseActionType.FullSyncUserAddErrorStatisticAnalyse },
      // { name: SyncAnalyseActionType.FullyncDeptUserAddErrorStatisticAnalyse },
      { name: SyncAnalyseActionType.FullSyncDeptAddErrorStatisticAnalyse },
      { name: SyncAnalyseActionType.FullSyncCollectTableStatisticAnalyse }
    ])
    await this.onRun(analyseTask)
  }

  private async onRun(analyseTask: AnalyseSyncTask) {
    while(!analyseTask.isEmpty()) {
      // 检查任务是否需要终止
      this.las.checkStatisticAnalyseIdNeedStop(analyseTask.taskId, analyseTask.cfg.companyId)

      const item = analyseTask.pop()
      switch (item.name) {
        case SyncAnalyseActionType.FullSyncAddErrorStatisticAnalyse:
          await this.onAddErrorStatisticAnalyse(analyseTask)
          break
        case SyncAnalyseActionType.FullSyncDeptAddErrorStatisticAnalyse:
          await this.onDeptAddErrorStatisticAnalyse(analyseTask)
          break
        case SyncAnalyseActionType.FullSyncUserAddErrorStatisticAnalyse:
          await this.onUserAddErrorStatisticAnalyse(analyseTask)
          break
        case SyncAnalyseActionType.FullyncDeptUserAddErrorStatisticAnalyse:
          await this.onDeptUserAddErrorStatisticAnalyse(analyseTask)
          break
        case SyncAnalyseActionType.FullSyncCollectTableStatisticAnalyse:
          await this.onCollectTableStatisticAnalyse(analyseTask)
          break
        default:
          throw new Exception('sync.statisticAnalyse.onRun.Failed', `unknown action: ${item.name}`)
      }
    }
  }

  private async onCollectTableStatisticAnalyse(analyseTask: AnalyseSyncTask) {
    const ctx: ICollectTableStatisticAnalyseContext = {
      engine: this,
      analyseTask: analyseTask
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<ICollectTableStatisticAnalyseResult>(
      SyncAnalyseStrategyType.FullSyncCollectTableStatisticAnalyse,
      ctx
    )
    log.d('sync.statisticAnalyse.onCollectTableStatisticAnalyse', `[${tick.end()}]`)
    check(ret)
    return ret
  }

  private async onDeptAddErrorStatisticAnalyse(analyseTask: AnalyseSyncTask) {
    const ctx: IDeptAddErrorStatisticAnalyseContext = {
      engine: this,
      analyseTask: analyseTask
    }
    const tick = new Ticker()
    const ret = await this.sm.exec(
      SyncAnalyseStrategyType.FullSyncDeptAddErrorStatisticAnalyse,
      ctx
    )
    log.d('sync.statisticAnalyse.onDeptAddErrorStatisticAnalyse', `[${tick.end()}]`)
    check(ret)
    return ret
  }

  private async onUserAddErrorStatisticAnalyse(analyseTask: AnalyseSyncTask) {
    const ctx: IUserAddErrorStatisticAnalyseContext = {
      engine: this,
      analyseTask: analyseTask
    }
    const tick = new Ticker()
    const ret = await this.sm.exec(
      SyncAnalyseStrategyType.FullSyncUserAddErrorStatisticAnalyse,
      ctx
    )
    log.d('sync.statisticAnalyse.onUserAddErrorStatisticAnalyse', `[${tick.end()}]`)
    check(ret)
    return ret
  }

  private async onDeptUserAddErrorStatisticAnalyse(analyseTask: AnalyseSyncTask) {
    const ctx: IDeptUserAddErrorStatisticAnalyseContext = {
      engine: this,
      analyseTask: analyseTask
    }
    const tick = new Ticker()
    const ret = await this.sm.exec(
      SyncAnalyseStrategyType.FullyncDeptUserAddErrorStatisticAnalyse,
      ctx
    )
    log.d('sync.statisticAnalyse.onDeptUserAddErrorStatisticAnalyse', `[${tick.end()}]`)
    check(ret)
    return ret
  }

  private async onAddErrorStatisticAnalyse(analyseTask: AnalyseSyncTask) {
    const ctx: IAddErrorStatisticAnalyseContext = {
      engine: this,
      analyseTask: analyseTask
    }
    const tick = new Ticker()
    const ret = await this.sm.exec(
      SyncAnalyseStrategyType.FullSyncAddErrorStatisticAnalyse,
      ctx
    )
    log.d('sync.statisticAnalyse.onAddErrorStatisticAnalyse', `[${tick.end()}]`)
    check(ret)
    return ret
  }
}
