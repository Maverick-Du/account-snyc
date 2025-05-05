import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { parse } from 'date-fns';
import { getOriginTaskId } from '../../common/util';
import {FullSyncCommon} from "../../modules/sync/types";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.get('/api/manage/fullsync/task/detail', async (ctx: Context) => {
  try {
    let taskId = ctx.request.query.taskId
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

    const taskDetail = await admin.getFullSyncTaskDetail(taskId, companyId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', taskDetail)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
