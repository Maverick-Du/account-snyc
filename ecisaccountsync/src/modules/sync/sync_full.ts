import {SyncContext} from './context'
import {lockService} from '../lock'
import {LockKey} from "../lock/LockService";
import fullSyncTaskService from '../service/FullSyncTaskService'
import {FullSyncStatus} from "../db/types";
import {CompanyCfg} from "../../sdk/account";
import config from "../../common/config";
import { log } from '../../sdk/cognac';

export default async function fullSync(ctx: SyncContext, taskId: string, cfg: CompanyCfg, continueSync: boolean = false) {
  log.i({ info: `full sync ${taskId} start... thirdCompanyId: ${cfg.thirdCompanyId}, companyId: ${cfg.companyId}` })
  let lockId = 0
  let lockKey = `${LockKey.BATCH_SYNC}_${cfg.companyId}`
  let statisticAnalyseLockKey = `${LockKey.SYNC_STATISTIC_ANALYSE}_${cfg.companyId}`
  try {
    // 判断全量同步统计分析锁是否加锁中
    const existAnalyseLock = await lockService.existLock(statisticAnalyseLockKey)
    if (existAnalyseLock) {
      // 存在全量同步统计分析任务，不执行全量同步
      log.i({ info: `full sync ${taskId} exit. reason: exist full sync statistic analyse task`})
      return
    }
    lockId = await lockService.tryLock(lockKey, `${lockKey}_FULL_SYNC_${taskId}`)
    if (lockId <= 0) {
      log.i({ info: `full sync ${taskId} exit. reason: not get lock`})
      return
    }
    // 校验task状态
    let task = await fullSyncTaskService.getTask(taskId, cfg.companyId)
    if (task.status != FullSyncStatus.TO_SYNC) {
      log.i({ info: `full sync ${taskId} exit. reason: task status error. companyId: ${cfg.companyId}, status: ${task.status}`})
      return
    }
    // 重试任务检查
    if (!continueSync && await fullSyncTaskService.checkIsRetryTaskId(taskId, cfg.companyId)) {
      let previousTaskId = fullSyncTaskService.getPreviousTaskId(taskId)
      let previousTask = await fullSyncTaskService.getTask(previousTaskId, cfg.companyId)
      if (!previousTask) {
        await fullSyncTaskService.cancelTask(taskId, cfg.companyId, `未找到原任务，重试任务取消`)
        return
      }
      let existTask = await fullSyncTaskService.checkRetryTaskCanRun(previousTask.id, cfg.companyId, task.id)
      if (existTask && existTask.length > 0) {
        await fullSyncTaskService.cancelTask(taskId, cfg.companyId, `已有其他任务执行，该任务取消`)
        return
      }
    } else {
      let existTask = await fullSyncTaskService.checkTaskCanRun(task.id, cfg.companyId)
      if (existTask && existTask.length > 0) {
        await fullSyncTaskService.cancelTask(taskId, cfg.companyId, `已有其他任务执行，该任务取消`)
        return
      }
    }
    // 取消前面的待同步任务
    await fullSyncTaskService.cancelBeforeTask(task.id, cfg.companyId,`已有新任务开始执行，该任务取消.taskId: ${taskId},companyId: ${cfg.companyId}`)
    // 任务开始
    let startFlag = await fullSyncTaskService.startTask(taskId, cfg.companyId, new Date(), config.regionId)
    if (startFlag > 0) {
      await ctx.start(task, cfg, continueSync)
    }
  } catch (err) {
    err.msg = `full sync ${taskId} throw full_sync_task_error. thirdCompanyId: ${cfg.thirdCompanyId}, msg: ${err.message}`
    log.error(err)
  } finally {
    log.i({ info: `full sync ${taskId} end... thirdCompanyId: ${cfg.thirdCompanyId}, companyId: ${cfg.companyId}`})
    if (lockId > 0) {
      await lockService.releaseLock(lockId, lockKey)
    }
  }
}
