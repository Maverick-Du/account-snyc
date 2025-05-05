import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { parse } from 'date-fns';
import { getOriginTaskId } from '../../common/util';
import logService from '../../modules/admin/log';
import { AdminOperationTypeEnum, OPERATION_MAP } from '../../modules/audit/type';
import {FullSyncCommon} from "../../modules/sync/types";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/task/retry', async (ctx: Context) => {
  let logTaskId = ''
  let logSyncTime = 0
  try {
    let syncTime = ctx.request.body.syncTime
    let taskId = ctx.request.body.taskId
    let userName = ctx.state.userName
    let account = ctx.state.account
    let companyId = ctx.state.companyId

    if (!taskId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'taskId is empty')
      return
    }
    taskId = taskId.toString()
    if (!syncTime) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'syncTime is empty')
      return
    }
    syncTime = syncTime.toString()
    let date = parse(getOriginTaskId(taskId), FullSyncCommon.TASK_ID_FORMAT, new Date())
    if (date.toString() === 'Invalid Date') {
        ctx.body = new Result(Result.PARAM_ERROR_CODE, `taskId format not ${FullSyncCommon.TASK_ID_FORMAT}`)
        return
    }

    logTaskId = taskId
    logSyncTime = syncTime

    const scheduleTime = new Date(Number(syncTime))
    const retryTaskId = await admin.retryFullSyncTask(taskId, companyId, scheduleTime, `${userName}（${account}）`)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', { task_id: retryTaskId })
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.RETRY_FULL_SYNC_TASK).detailCallback(taskId, syncTime, true)
    logService.logSuccess(ctx, AdminOperationTypeEnum.RETRY_FULL_SYNC_TASK, detail)
  } catch (err) {
    log.i(err);
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.RETRY_FULL_SYNC_TASK).detailCallback(logTaskId, logSyncTime, false)
    logService.logError(ctx, AdminOperationTypeEnum.RETRY_FULL_SYNC_TASK, err, detail)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
