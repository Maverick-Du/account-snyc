import {IDatabase} from "../../sdk/cognac/orm";
import {
  AddDepartmentTreeStrategy,
  CompanyCfg, DeleteDepartmentTreeStrategy,
  DiffDepartmentMembersStrategy,
  DiffDepartmentTreeStrategy,
  DiffUserTableStrategy,
  HandleLasDataCheckTypeStrategy,
  LocalAccountService,
  LocalAccountSystem,
  MoveDepartmentTreeStrategy,
  SyncEngine,
  SyncTask,
  UpdateDepartmentStrategy,
  V7AccountSystem
} from "../../sdk/account";
import {WPS4Context} from "../../sdk/common/wps4";
import fullSyncTaskService from "../service/FullSyncTaskService";
import statisticsService from "../service/FullSyncStatisticsService";
import {FullSyncStatus} from "../db/types";
import syncJobSettingService from '../service/SyncJobSettingService'
import {ScheduleJobType} from "../schedule/ScheduleService";
import {format} from 'date-fns';
import {ISyncCommon} from "../increment_sync/types";
import {CommonErrorName, TaskStopError} from "./types";
import config from "../../common/config";
import {FullSyncTaskSchema} from "../db/tables/FullSyncTask";
import {
  AddDepartmentStrategy,
  AddDeptMembersStrategy,
  BatchDeleteUserStrategy,
  DeleteDepartmentStrategy,
  DeleteDeptMemberStrategy,
  DisableUsersStrategy,
  EnableUsersStrategy,
  JoinDeptMemberStrategy,
  MoveDepartmentStrategy,
  UpdateDepartmentPropertiesStrategy,
  UpdateDeptMemberStrategy,
  UpdateUserLeaderStrategy,
  UpdateUserStrategy
} from "../../sdk/account/executor";
import {log, Strategy, StrategyManager} from "../../sdk/cognac";
import {QuickAddUserStrategy} from "../../sdk/account/strategies/QuickAddUserStrategy";
import {SyncDeptDiffDepartmentTreeStrategy} from "../../sdk/account/strategies/SyncDeptDiffDepartmentTreeStrategy";
import {SyncDeptAddDepartmentTreeStrategy} from "../../sdk/account/strategies/SyncDeptAddDepartmentTreeStrategy";
import {SyncDeptDeleteDepartmentTreeStrategy} from "../../sdk/account/strategies/SyncDeptDeleteDepartmentTreeStrategy";
import {SyncDeptMoveDepartmentTreeStrategy} from "../../sdk/account/strategies/SyncDeptMoveDepartmentTreeStrategy";
import {StatisticsErrorDeptAndUsers} from "../../sdk/account/strategies/StatisticsErrorDeptAndUsers";
import {V7OpenIamService} from "../../sdk/account/sync/was/V7OpenIamService";
import {KSO1Context} from "../../sdk/common/kso1";

export class SyncContext {
  was: V7AccountSystem
  openIam: V7OpenIamService
  las: LocalAccountSystem
  strategies: StrategyManager
  engine: SyncEngine

  init(options: { db: IDatabase; ctx: WPS4Context; kso1Ctx: KSO1Context; strategies: Strategy[] }) {
    const { db, ctx, kso1Ctx, strategies } = options
    const las = new LocalAccountService(db)

    this.las = new LocalAccountSystem(las)
    this.was = new V7AccountSystem(ctx, db)
    this.openIam = new V7OpenIamService(kso1Ctx)
    this.strategies = new StrategyManager()
    this.engine = new SyncEngine(this.las, this.was, this.openIam, this.strategies)

    this.setup(strategies)
  }

  // 开始同步
  async start(taskSchema: FullSyncTaskSchema, cfg: CompanyCfg, continueSync: boolean) {
    let flag = false
    let originTaskId = fullSyncTaskService.getOriginTaskId(taskSchema.task_id)
    const task = new SyncTask(this.engine, taskSchema, originTaskId, cfg, continueSync)
    try {
      task.statistics = statisticsService.newStatistics(task.taskId, cfg.companyId)
      await this.engine.start(task)
      // 任务结束
      await SyncContext.endTask(task, FullSyncStatus.SYNC_SUCCESS, null)
      flag = true
    } catch (err) {
      if (err instanceof TaskStopError) {
        log.i({info: `full sync ${task.taskId} exit. reason: ${err.message}`})
        if (err.name == CommonErrorName.TaskDeleteThreshold
            || err.name == CommonErrorName.TaskScopeAbsence) {
          log.info({info: `full sync ${task.taskId} full_sync_task_warn 触发警告，请确认风险后再同步！`})
        } else {
          task.status = FullSyncStatus.SYNC_FAIL
        }
        await SyncContext.endTask(task, task.status, err.message?.substring(0,2000))
      } else {
        err.msg = `full sync ${task.taskId} sdk start throw full_sync_task_error. thirdCompanyId: ${cfg.thirdCompanyId}, msg: ${err.message}`
        log.error(err)
        flag = await this.handleFailAndRetry(task, err)
      }
    } finally {
      if (flag && await fullSyncTaskService.checkIsRetryTaskId(task.taskId, cfg.companyId)) {
        // 异常任务重试成功后，需要启动定时任务
        await syncJobSettingService.reopenSyncJob(task.cfg.companyId)
        log.i({info: `full sync ${task.taskId} retry success and restart sync job. companyId: ${task.cfg.companyId}`})
      }
    }
  }

  async handleFailAndRetry(task: SyncTask, err: any) {
    let flag = false
    for (let i = 0; i < 3; i++) {
      if (config.errorRetry.open <= 0) {
        break
      }
      log.i({info: `full sync ${task.taskId} retry ${i+1} times, thirdCompanyId: ${task.cfg.thirdCompanyId}`})
      if (config.errorRetry.idle > 0) {
        let hour = new Date().getHours()
        if (hour >= 6 && hour <= 18) {
          break
        }
      }
      try {
        // 重置部分数据
        task.statistics.sync_user = 0
        task.statistics.sync_dept = 0
        task.statistics.sync_dept_user = 0

        await this.engine.start(task)
        // 任务结束
        await SyncContext.endTask(task, FullSyncStatus.SYNC_SUCCESS, null)
        log.i({info: `full sync ${task.taskId} retry ${i+1} times success, thirdCompanyId: ${task.cfg.thirdCompanyId}`})
        flag = true
        break
      } catch (er) {
        if (err instanceof TaskStopError) {
          log.i({info: `full sync ${task.taskId} exit. reason: ${err.message}`})
          if (task.status == FullSyncStatus.SYNC_DEL_WARN
              || task.status == FullSyncStatus.SYNC_SCOPE_WARN) {
            log.info({info: `full sync ${task.taskId} full_sync_task_warn 触发警告，请确认风险后再同步！`})
          } else {
            task.status = FullSyncStatus.SYNC_FAIL
          }
          await SyncContext.endTask(task, task.status, err.message?.substring(0,2000))
          flag = true
          break
        } else {
          er.msg = `full sync ${task.taskId} retry throw full_sync_task_error, thirdCompanyId: ${task.cfg.thirdCompanyId}, msg: ${err.message}`
          log.e(er)
        }
      }
    }
    if (!flag) {
      // 任务失败
      await SyncContext.endTask(task, FullSyncStatus.SYNC_FAIL, err.message?.substring(0,2000))
      // 暂停任务
      await syncJobSettingService.stopSyncJob(task.cfg.companyId)
      log.i({info: `full sync ${task.taskId} failed and stop sync job. companyId: ${task.cfg.companyId}`})
    }
    return flag
  }

  private static async endTask(task: SyncTask, status: FullSyncStatus, msg: string) {
    let statisticsSchema = statisticsService.getStatistics(task.statistics)
    if (status == FullSyncStatus.SYNC_SUCCESS && task.statistics.total_error > 0) {
      msg = `任务同步成功，已跳过异常数据，可下载异常详情，部门同步异常${task.statistics.dept_error}; 用户同步异常${
        task.statistics.user_error}; 部门用户关系同步异常${task.statistics.dept_user_error}`
      log.i({info: `full sync ${task.taskId} full_sync_exist_error 全量同步完成，存在异常记录！`})
    }
    await fullSyncTaskService.endTask(task.taskId, task.cfg.companyId, status, new Date(), msg, task.scopeVersion)
    let statistics = await fullSyncTaskService.getFullSyncStatisticData(task.taskId, task.cfg.companyId)
    if (statistics) {
      await fullSyncTaskService.updateStatistics(statisticsSchema)
    } else {
      await fullSyncTaskService.saveStatistics(statisticsSchema)
    }
    await syncJobSettingService.updateEndTime(task.cfg.companyId, ScheduleJobType.FULL_SYNC_JOB, format(new Date(), ISyncCommon.TIME_FORMAT))
  }

  setup(strategies: Strategy[] = []) {
    this.strategies.load(
        new HandleLasDataCheckTypeStrategy(),
        new StatisticsErrorDeptAndUsers(),
        new SyncDeptDiffDepartmentTreeStrategy(),
        new SyncDeptAddDepartmentTreeStrategy(),
        new SyncDeptDeleteDepartmentTreeStrategy(),
        new SyncDeptMoveDepartmentTreeStrategy(),
        new QuickAddUserStrategy(),
        new DiffUserTableStrategy(),
        new DiffDepartmentTreeStrategy(),
        new DeleteDepartmentTreeStrategy(),
        new UpdateDepartmentStrategy(),
        new DiffDepartmentMembersStrategy(),
        new AddDepartmentTreeStrategy(),
        new MoveDepartmentTreeStrategy(),
        new AddDepartmentStrategy(),
        new AddDeptMembersStrategy(),
        new BatchDeleteUserStrategy(),
        new DeleteDepartmentStrategy(),
        new DeleteDeptMemberStrategy(),
        new DisableUsersStrategy(),
        new EnableUsersStrategy(),
        new JoinDeptMemberStrategy(),
        new MoveDepartmentStrategy(),
        new UpdateDepartmentPropertiesStrategy(),
        new UpdateDeptMemberStrategy(),
        new UpdateUserLeaderStrategy(),
        new UpdateUserStrategy(),
        ...strategies,
    )
  }
}
