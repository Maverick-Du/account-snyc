import { Result } from '../../common/type';
import statisticAnalyse from '../../modules/full_sync_statistic_analyse/manage_admin';
import { parse } from 'date-fns';
import { getOriginTaskId } from '../../common/util';
import {FullSyncCommon} from "../../modules/sync/types";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.get('/api/manage/fullsync/task/analyse/detail', async (ctx: Context) => {
  try {
    let taskId = ctx.request.query?.task_id as string
    let companyId = ctx.state.companyId as string

    if (!taskId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'task_id is empty')
      return
    }
    taskId = taskId.toString()
    let date = parse(getOriginTaskId(taskId), FullSyncCommon.TASK_ID_FORMAT, new Date())
    if (date.toString() === 'Invalid Date') {
        ctx.body = new Result(Result.PARAM_ERROR_CODE, `task_id format not ${FullSyncCommon.TASK_ID_FORMAT}`)
        return
    }

    const data = await statisticAnalyse.queryFullSyncTaskDetail(taskId, companyId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', data)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
