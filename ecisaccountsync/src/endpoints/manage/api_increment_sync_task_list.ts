import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { IncrementStatus, SyncType } from '../../modules/db/types';
import { IncrementScheduleTime, IncrementSyncType } from '../../modules/admin/type';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/incrementsync/task/list', async (ctx: Context) => {
  try {
    let content = ctx.request.body?.content
    let scheduleTime = ctx.request.body?.scheduleTime as IncrementScheduleTime
    let type = ctx.request.body?.type as IncrementSyncType
    let syncWay = ctx.request.body?.syncWay as SyncType[]
    let status = ctx.request.body?.status as IncrementStatus[]
    let offset = ctx.request.body?.offset as number
    let limit = ctx.request.body?.limit as number
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
    if (type === undefined) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'type is empty')
      return
    }
    if (type !== IncrementSyncType.DEPT && type !== IncrementSyncType.USER && type !== IncrementSyncType.USER_DEPT) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, `type format is invalid, right type: ${IncrementSyncType.DEPT} | ${IncrementSyncType.USER} | ${IncrementSyncType.USER_DEPT}, current type: ${type}`)
      return
    }
    if (!syncWay || syncWay.length === 0) {
      syncWay = [SyncType.AUTO, SyncType.MANUAL]
    }
    if (!Array.isArray(syncWay) || syncWay.some(sync => sync !== SyncType.AUTO && sync !== SyncType.MANUAL)) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, `syncWay format is invalid, right syncWay: [${SyncType.AUTO} | ${SyncType.MANUAL}], current syncWay: ${syncWay}`)
      return
    }
    if (!status || status.length === 0) {
      status = [IncrementStatus.FAIL, IncrementStatus.SUCCESS]
    }
    if (!Array.isArray(status) || status.some(status => ( status !== IncrementStatus.FAIL && status !== IncrementStatus.SUCCESS))) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, `status format is invalid, right status: [${IncrementStatus.FAIL} | ${IncrementStatus.SUCCESS}], current status: ${status}`)
      return
    }
    if (scheduleTime && (!scheduleTime.endTime || !scheduleTime.startTime )) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'scheduleTime is empty, need startTime and endTime')
      return
    }

    const companyId = ctx.state.companyId
    const data = await admin.getIncrementSyncList(type, syncWay, status, offset, limit, companyId, content, scheduleTime)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', data)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
