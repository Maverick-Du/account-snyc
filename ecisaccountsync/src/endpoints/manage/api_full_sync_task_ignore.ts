import { Result } from '../../common/type';
import { parse } from 'date-fns';
import admin from "../../modules/admin";
import logService from '../../modules/admin/log';
import { FullSyncCommon } from '../../modules/sync/types';
import { getOriginTaskId } from '../../common/util';
import { AdminOperationTypeEnum, OPERATION_MAP } from '../../modules/audit/type';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/task/ignore', async (ctx: Context) => {
  let logTaskId = ''
  try {
    let taskId = ctx.request.body.taskId
    let companyId = ctx.state.companyId

    if (!taskId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'taskId is empty')
      return
    }
    taskId = taskId.toString()
    let date = parse(getOriginTaskId(taskId), FullSyncCommon.TASK_ID_FORMAT, new Date())
    if (date.toString() === 'Invalid Date') {
        ctx.body = new Result(Result.PARAM_ERROR_CODE, `taskId format not ${FullSyncCommon.TASK_ID_FORMAT}`)
        return
    }

    logTaskId = taskId
    await admin.ignoreFailFullSyncTask(taskId, companyId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success')
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.IGNORE_FULL_SYNC_TASK).detailCallback(taskId, true)
    logService.logSuccess(ctx, AdminOperationTypeEnum.IGNORE_FULL_SYNC_TASK, detail)
  } catch (err) {
    log.i(err);
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.IGNORE_FULL_SYNC_TASK).detailCallback(logTaskId, false)
    logService.logError(ctx, AdminOperationTypeEnum.IGNORE_FULL_SYNC_TASK, err, detail)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
