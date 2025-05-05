import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { FullSyncStatus, SyncType } from '../../modules/db/types';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/task/list', async (ctx: Context) => {
  try {
    let syncWay = ctx.request.body?.syncWay as SyncType[]
    let status = ctx.request.body?.status as FullSyncStatus[]
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
    if (!syncWay || syncWay.length === 0) {
      syncWay = [SyncType.AUTO, SyncType.MANUAL, SyncType.ROLLBACK, SyncType.ROLLRETRY]
    }
    if (syncWay.some(sync => sync !== SyncType.AUTO && sync !== SyncType.MANUAL && sync!== SyncType.ROLLBACK && sync !== SyncType.ROLLRETRY)) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, `syncWay format is invalid, right syncWay: ${SyncType.AUTO} | ${SyncType.MANUAL} | ${SyncType.ROLLBACK} | ${SyncType.ROLLRETRY}, current syncWay: ${syncWay}`)
      return
    }
    if (!status || status.length === 0) {
      status = [FullSyncStatus.SYNC_CANCEL, FullSyncStatus.SYNC_FAIL, FullSyncStatus.SYNC_ING, FullSyncStatus.SYNC_SUCCESS, FullSyncStatus.TO_SYNC, FullSyncStatus.SYNC_DEL_WARN, FullSyncStatus.SYNC_SCOPE_WARN]
    }
    if (status.some(status => ( status !== FullSyncStatus.SYNC_CANCEL && status !== FullSyncStatus.SYNC_FAIL && status !== FullSyncStatus.SYNC_ING && status !== FullSyncStatus.SYNC_SUCCESS && status !== FullSyncStatus.TO_SYNC && status!== FullSyncStatus.SYNC_DEL_WARN && status!== FullSyncStatus.SYNC_SCOPE_WARN))) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, `status format is invalid, right status: ${FullSyncStatus.SYNC_CANCEL} | ${FullSyncStatus.SYNC_FAIL} | ${FullSyncStatus.SYNC_ING} | ${FullSyncStatus.SYNC_SUCCESS} | ${FullSyncStatus.TO_SYNC} | ${FullSyncStatus.SYNC_DEL_WARN} | ${FullSyncStatus.SYNC_SCOPE_WARN}, current status: ${status}`)
      return
    }

    const companyId = ctx.state.companyId
    const data = await admin.getFullSyncTaskList(status, syncWay, offset, limit, companyId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', data)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
