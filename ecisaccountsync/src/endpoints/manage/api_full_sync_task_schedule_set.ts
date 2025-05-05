import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { SyncJobSettingOpenStatus } from '../../modules/db/types';
import logService from '../../modules/admin/log';
import { AdminOperationTypeEnum, OPERATION_MAP } from '../../modules/audit/type';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/schedule/setting', async (ctx: Context) => {
  let logOpen = false
  try {
    let open = ctx.request.body.open as SyncJobSettingOpenStatus
    if (open === undefined) {
      ctx.body = new Result(Result.FAIL_CODE, 'open is empty')
      return
    }

    if (open !== SyncJobSettingOpenStatus.DISABLE && open !== SyncJobSettingOpenStatus.ENABLE) {
      ctx.body = new Result(Result.FAIL_CODE, `open format is invalid, right type: ${SyncJobSettingOpenStatus.ENABLE} | ${SyncJobSettingOpenStatus.DISABLE}, right type: ${open}`)
      return
    }

    logOpen = !!open

    const companyId = ctx.state.companyId
    const isSuccess = await admin.fullSyncConfigSet(open, companyId)
    if (!isSuccess) {
      ctx.body = new Result(Result.FAIL_CODE, '更新失败，请稍后再试')
      return
    }
    ctx.body = new Result(Result.SUCCESS_CODE, 'success')
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.FULL_SYNC_AUTO_CONFIG).detailCallback(!!open, true)
    logService.logSuccess(ctx, AdminOperationTypeEnum.FULL_SYNC_AUTO_CONFIG, detail)
  } catch (err) {
    log.i(err);
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.FULL_SYNC_AUTO_CONFIG).detailCallback(logOpen, false)
    logService.logError(ctx, AdminOperationTypeEnum.FULL_SYNC_AUTO_CONFIG, err, detail)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
