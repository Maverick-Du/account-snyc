import {Result} from '../../common/type';
import fullSyncDelThresholdService from '../../modules/service/FullSyncDelThresholdService'
import { AdminOperationTypeEnum, OPERATION_MAP } from '../../modules/audit/type';
import logService from '../../modules/admin/log';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/threshold/save', async (ctx: Context) => {
  let logUserDel = 0
  let logDeptDel = 0
  let logDeptUserDel = 0
  try {
    let user_del = ctx.request.body.user_del
    let dept_del = ctx.request.body.dept_del
    let dept_user_del = ctx.request.body.dept_user_del
    let companyId = ctx.state.companyId
    let userName = ctx.state.userName

    if (!user_del || !dept_del || !dept_user_del) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'user_del or dept_del or dept_user_del is empty')
      return
    }
    if (!companyId) {
      ctx.body = new Result(Result.FAIL_CODE, "获取当前用户信息失败")
      return ctx
    }
    logUserDel = user_del
    logDeptDel = dept_del
    logDeptUserDel = dept_user_del

    await fullSyncDelThresholdService.updateConfig(companyId, user_del, dept_del, dept_user_del, userName)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success')
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.FULL_SYNC_THRESHOLD_SET).detailCallback(user_del, dept_del, dept_user_del, true)
    logService.logSuccess(ctx, AdminOperationTypeEnum.FULL_SYNC_THRESHOLD_SET, detail)
  } catch (err) {
    log.i(err);
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.FULL_SYNC_THRESHOLD_SET).detailCallback(logUserDel, logDeptDel, logDeptUserDel, false)
    logService.logError(ctx, AdminOperationTypeEnum.FULL_SYNC_THRESHOLD_SET, err, detail)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
