import {SyncContext} from './context'

import db from '../db/DbManager'
import docmini from '../../common/docmini'
import syncClear from './sync_clear'
import syncClearAllUsers from './sync_clear_all_users'
import syncClearAllDepts from './sync_clear_all_depts'
import fullSync from './sync_full'
import fullSyncTaskService from '../service/FullSyncTaskService'
import fullSyncRecordService from '../service/FullSyncRecordService'
import {FullSyncStatus, SyncJobSettingOpenStatus, SyncType} from "../db/types";
import {FullSyncTaskSchema} from "../db/tables/FullSyncTask";
import syncJobSettingService from "../service/SyncJobSettingService";
import {companyCfgService} from "../companyCfg";
import {ScheduleJobType} from "../schedule/ScheduleService";
import {Result} from "../../common/type";
import {CompanyCfg} from "../../sdk/account";
import config from "../../common/config";
import {log, Strategy} from "../../sdk/cognac";
import {KSO1Context} from "../../sdk/common/kso1";

export default new (class {
  ctx: SyncContext

  init(options: { strategies?: Strategy[] } = {}) {
    const { strategies = [] } = options
    this.ctx = new SyncContext()
    let kso1Ctx = new KSO1Context(
        config.open.host,
        config.appId,
        config.appKey,
    )
    this.ctx.init({
      ctx: docmini.ctx,
      kso1Ctx: kso1Ctx,
      db: db.collectDb,
      strategies,
    })
  }

  async continueSync(
      task: FullSyncTaskSchema,
      cfg: CompanyCfg,
      operator: string
  ) {
    let flag = await fullSyncTaskService.resetTask(task.task_id, cfg.companyId, operator)
    if (flag > 0) {
      // 删除告警记录
      await fullSyncRecordService.deleteRecordDataByTaskId(task.task_id)
      if (await fullSyncTaskService.querySyncingTask() == null) {
        fullSync(this.ctx, task.task_id, cfg, true)
      }
    }
  }

  async extraFullSync(
      taskId: string,// 当前任务ID
      companyId: string,
      syncType: SyncType,
      operator: string,
      scheduleTime: Date = new Date(),
  ) {
    let cfg = await companyCfgService.getCfgByCompanyId(companyId)
    if (!cfg) {
      throw new Error(`未找到对应的tb_company_cfg配置, companyId: ${companyId}`)
    }

    let originTaskId = fullSyncTaskService.getOriginTaskId(taskId)
    // 获取最近一次任务
    const recentTaskData = await fullSyncTaskService.getLatestRetryFullSyncTask(companyId, originTaskId)
    let extraTaskId = fullSyncTaskService.handleRetryTaskId(recentTaskData.task_id)
    await this.fullSync(extraTaskId, cfg, recentTaskData.collect_cost, scheduleTime, syncType, operator)
    return extraTaskId
  }

  async fullSync(
      taskId: string,
      cfg: CompanyCfg,
      collectCost: number,
      scheduleTime: Date = new Date(),
      syncType: SyncType = SyncType.AUTO,
      operator?: string
  ): Promise<Result> {
    // 创建任务
    let task = {
      task_id: taskId,
      company_id: cfg.companyId,
      sync_type: syncType,
      operator: operator ? operator : "系统",
      collect_cost: collectCost,
      schedule_time: scheduleTime,
      status: FullSyncStatus.TO_SYNC,
      region_id: config.regionId
    } as FullSyncTaskSchema
    let id = await fullSyncTaskService.createTask(task)

    // 取消前面的待同步任务
    await fullSyncTaskService.cancelBeforeTask(id, cfg.companyId,`已有新的同步，该任务取消.taskId: ${taskId},companyId: ${cfg.companyId}`)

    if (syncType == SyncType.AUTO) {
      let setting = await syncJobSettingService.getSyncConfig(cfg.companyId, ScheduleJobType.FULL_SYNC_JOB)
      if (!setting || setting.open == SyncJobSettingOpenStatus.DISABLE) {
        return new Result(Result.SUCCESS_CODE, "success")
      }
    }
    // 执行任务
    if (scheduleTime.getTime() <= new Date().getTime()) {
      if (await fullSyncTaskService.querySyncingTask() == null) {
        fullSync(this.ctx, task.task_id, cfg, false)
      }
    }
    return new Result(Result.SUCCESS_CODE, "success")
  }

  async clearAllUsers(
    taskId: string,
    lCompanyId: string,
    wCompanyId: string,
    platformId: string,
  ) {
    try {
      log.i('sync delete all users start')
      return syncClearAllUsers(
        this.ctx,
        taskId,
        lCompanyId,
        wCompanyId,
        platformId,
      )
    } catch (err) {
      log.error(`sync delete all users failed`, err)
    } finally {
      log.i('sync delete all users over')
    }
  }

  async clearAllDepts(
    taskId: string,
    lCompanyId: string,
    wCompanyId: string,
    platformId: string,
  ) {
    try {
      log.i('sync delete all depts start')
      return syncClearAllDepts(
        this.ctx,
        taskId,
        lCompanyId,
        wCompanyId,
        platformId,
      )
    } catch (err) {
      log.error(`sync delete all depts failed`, err)
    } finally {
      log.i('sync delete all depts over')
    }
  }

  async clear() {
    try {
      log.i('sync clear started')
      return syncClear(this.ctx)
    } catch (err) {
      log.error(`sync clear failed`, err)
    } finally {
      log.i('sync clear over')
    }
  }
})()
