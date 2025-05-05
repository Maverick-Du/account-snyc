import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { ISuccessTaskSchedule } from '../../modules/admin/type';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/task/success', async (ctx: Context) => {
  try {
    let content = ctx.request.body?.content as string
    let scheduleTime = ctx.request.body?.scheduleTime as ISuccessTaskSchedule
    let offset = ctx.request.body?.offset as number
    let limit = ctx.request.body?.limit as number

    const threeMonthAgoTime = Date.now() - 1000 * 60 * 60 * 24 * 90

    if (!scheduleTime) {
      // 查询最近三个月数据
      scheduleTime = {
        startTime: threeMonthAgoTime,
        endTime: Date.now()
      }
    }
    if (scheduleTime && (!scheduleTime?.startTime ||!scheduleTime?.endTime)) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'schedule is empty, need startTime and endTime')
      return
    }
    if (scheduleTime.startTime < threeMonthAgoTime || scheduleTime.endTime < threeMonthAgoTime) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE,'schedule is invalid, only query data in the last 3 months')
      return
    }
    if (offset === undefined) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'offset is empty')
      return
    }
    if (!/^(0|[1-9]\d*)$/.test(String(offset))) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'offset is invalid')
      return
    }
    if (limit === undefined) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'limit is empty')
      return
    }
    if (!/^(0|[1-9]\d*)$/.test(String(limit))) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'limit is invalid')
      return
    }

    const companyId = ctx.state.companyId
    const data = await admin.getFullSyncSuccessTasks(companyId, offset, limit, scheduleTime, content)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', data)

  } catch (err) {
    log.error(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
