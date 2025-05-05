import { Result } from '../../common/type';
import admin from "../../modules/admin";
import {SyncJobSettingOpenStatus, SyncJobSettingRateType} from "../../modules/db/types";
import logService from '../../modules/admin/log';
import { AdminOperationTypeEnum, OPERATION_MAP } from '../../modules/audit/type';
import {IIncrementSyncTimeDetail} from "../../modules/admin/type";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/incrementsync/schedule/setting', async (ctx: Context) => {
  let config: IIncrementSyncTimeDetail
  let open = ctx.request.body?.open
  let type = ctx.request.body?.type
  let rate = ctx.request.body?.rate
  try {
    let companyId = ctx.state.companyId
    if (open === undefined && type === undefined && rate === undefined) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, '参数为空')
      return
    }

    if (open != undefined) {
      if (open !== SyncJobSettingOpenStatus.DISABLE && open !== SyncJobSettingOpenStatus.ENABLE) {
        ctx.body = new Result(Result.PARAM_ERROR_CODE, `open format is invalid, right type: ${SyncJobSettingOpenStatus.ENABLE} || ${SyncJobSettingOpenStatus.DISABLE}, current type: ${open}`)
        return
      }
      config = await admin.getIncrementSyncConfig(companyId)
      config.open = open
    } else {
      if (type !== SyncJobSettingRateType.MIN && type !== SyncJobSettingRateType.HOUR) {
        ctx.body = new Result(Result.PARAM_ERROR_CODE, `type format is invalid, right type: ${SyncJobSettingRateType.MIN} || ${SyncJobSettingRateType.HOUR}, current type: ${type}`)
        return
      }
      if (type === SyncJobSettingRateType.MIN && ( rate < 1 || rate > 30 )) {
        ctx.body = new Result(Result.PARAM_ERROR_CODE, `rate format is invalid, in type ${type}: rate must be >= 1 and <= 30, current rate: ${rate}`)
        return
      } else if (type === SyncJobSettingRateType.HOUR && (rate < 1 || rate > 12 )) {
        ctx.body = new Result(Result.PARAM_ERROR_CODE, `rate format is invalid, in type ${type}: rate must be >= 1 and <= 12, current rate: ${rate}`)
        return
      }
      config = await admin.getIncrementSyncConfig(companyId)
      config.rate = rate
      config.type = type
    }
    if (!config) {
      ctx.body = new Result(Result.FAIL_CODE, '增量同步配置不存在')
      return
    }

    const isSuccess = await admin.incrementSyncConfigSet(companyId, config.open, config.type as SyncJobSettingRateType, config.rate)
    if (!isSuccess) {
      ctx.body = new Result(Result.FAIL_CODE, '更新失败，请稍后再试')
      return
    }
    ctx.body = new Result(Result.SUCCESS_CODE, 'success')
    if (open != undefined) {
      let detailOpen = OPERATION_MAP.get(AdminOperationTypeEnum.INCREMENT_SYNC_AUTO_CONFIG).detailCallback(!!open, true)
      logService.logSuccess(ctx, AdminOperationTypeEnum.INCREMENT_SYNC_AUTO_CONFIG, detailOpen)
    } else {
      let detailRate = OPERATION_MAP.get(AdminOperationTypeEnum.INCREMENT_SYNC_RATE_CONFIG).detailCallback(rate, type, true)
      logService.logSuccess(ctx, AdminOperationTypeEnum.INCREMENT_SYNC_AUTO_CONFIG, detailRate)
    }
  } catch (err) {
    log.i(err);
    if (open != undefined) {
      let detailOpen = OPERATION_MAP.get(AdminOperationTypeEnum.INCREMENT_SYNC_AUTO_CONFIG).detailCallback(!!open, false)
      logService.logError(ctx, AdminOperationTypeEnum.INCREMENT_SYNC_AUTO_CONFIG, err, detailOpen)
    } else {
      let detailRate = OPERATION_MAP.get(AdminOperationTypeEnum.INCREMENT_SYNC_RATE_CONFIG).detailCallback(rate, type, false)
      logService.logError(ctx, AdminOperationTypeEnum.INCREMENT_SYNC_RATE_CONFIG, err, detailRate)
    }
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
