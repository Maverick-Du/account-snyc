import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { parse } from 'date-fns';
import { getOriginTaskId } from '../../common/util';
import {FullSyncCommon} from "../../modules/sync/types";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/task/isretry', async (ctx: Context) => {
  try {
    let taskId = ctx.request.body.taskId
    let companyId = ctx.request.body.companyId

    if (!taskId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'taskId is empty')
      return
    }
    taskId = taskId.toString()
    if (!companyId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'companyId is empty')
      return
    }
    companyId = companyId.toString()
    let date = parse(getOriginTaskId(taskId), FullSyncCommon.TASK_ID_FORMAT, new Date())
    if (date.toString() === 'Invalid Date') {
        ctx.body = new Result(Result.PARAM_ERROR_CODE, `taskId format not ${FullSyncCommon.TASK_ID_FORMAT}`)
        return
    }

    const result = await admin.isRetryFullSyncTask(taskId, companyId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', { is_retry: result })

  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
