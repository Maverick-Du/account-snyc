import * as schedule from 'node-schedule'
import config from "../../common/config";
import sync from '../sync';
import updateScheduleJobService from './UpdateScheduleJobService'
import {SyncJobSettingOpenStatus} from "../db/types";
import {JobCallback} from "node-schedule";
import syncJobSettingService from "../service/SyncJobSettingService";
import { log } from '../../sdk/cognac';

export enum ScheduleJobType {
  FULL_SYNC_JOB = "FULL_SYNC_JOB",
  INCREMENT_SYNC_JOB = "INCREMENT_SYNC_JOB",
}

export interface SyncJobContext {
  company_id: string
  sync_type: ScheduleJobType
}

export interface ScheduleJob {
  job: schedule.Job
  status: SyncJobSettingOpenStatus
}


export class ScheduleService {
  jobs: Map<string, ScheduleJob>

  /**
   * 1. 增量同步定时任务
   * 2. 全量同步定时任务
   * 3. 全量采集表数据清理任务
   * 4. 增量数据表数据清理任务
   */

  async init() {
    this.jobs = new Map<string, ScheduleJob>()
    this.initClearDataJob()
    await this.initSyncJobSettingJob()
  }

  initClearDataJob() {
    if (!config.schedule.clearCron || config.schedule.clearCron === '') {
      log.i({ info: 'initClearDataJob cron not set!' })
      return
    }
    schedule.scheduleJob(config.schedule.clearCron, this.onSyncClear)
    log.i({ info: `initClearDataJob success! cron: ${config.schedule.clearCron}` })
  }

  async initSyncJobSettingJob() {
    let syncConfigs = await syncJobSettingService.getAllSyncConfig()

    for (const cg of syncConfigs) {
      if (cg.open == SyncJobSettingOpenStatus.DISABLE) {
        continue
      }
      if (cg.sync_type == ScheduleJobType.FULL_SYNC_JOB) {
        // 全量同步任务
        await updateScheduleJobService.initFullSyncJob(cg)
      } else if (cg.sync_type == ScheduleJobType.INCREMENT_SYNC_JOB) {
        // 增量同步任务
        await updateScheduleJobService.initIncrementSyncJob(cg)
      }
      log.i({ info: `init sync schedule job success! companyId: ${cg.company_id}, sync_type: ${cg.sync_type}, cron: ${cg.cron}` })
    }
  }

  scheduleJob(companyId: string, type: string, cron: string, callback: JobCallback) {
    let key = `${companyId}_${type}`
    let job = schedule.scheduleJob(cron, callback)
    this.jobs.set(key, {job: job, status: SyncJobSettingOpenStatus.ENABLE})
  }

  reschedule(companyId: string, sync_type: string, cron: string) {
    let key = `${companyId}_${sync_type}`
    let job = this.jobs.get(key)
    if (!job) {
      throw new Error(`not found schedule job. key: ${key}`)
    }
    job.job.reschedule(cron)
    job.status = SyncJobSettingOpenStatus.ENABLE
    log.i({info: `schedule job cron update. key: ${key}, cron: ${cron}`})
  }

  cancel(companyId: string, sync_type: string) {
    let key = `${companyId}_${sync_type}`
    let job = this.jobs.get(key)
    if (job && job.status == SyncJobSettingOpenStatus.ENABLE) {
      job.job.cancel()
      job.status = SyncJobSettingOpenStatus.DISABLE
      log.i({info: `schedule job cancel. key: ${key}`})
    }
  }

  async onSyncClear() {
    await sync.clear()
  }

}

export default new ScheduleService()
