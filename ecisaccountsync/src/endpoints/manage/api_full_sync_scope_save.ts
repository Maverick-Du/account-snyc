import { Result } from '../../common/type';
import {FullSyncScopeCheckData} from "../../modules/service/types";
import fullSyncScopeService from '../../modules/service/FullSyncScopeService'
import companyCfgService from '../../modules/companyCfg/CompanyCfgService'
import { AdminOperationTypeEnum, OPERATION_MAP } from '../../modules/audit/type';
import logService from '../../modules/admin/log';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/scope/save', async (ctx: Context) => {
  let logDeptCount: number = 0
  let logOperator = ''
  try {
    let taskId = ctx.request.body.task_id
    let datas: FullSyncScopeCheckData[] = ctx.request.body.data

    let companyId = ctx.state.companyId
    const userId = ctx.state.userId
    let userName = ctx.state.userName
    let account = ctx.state.account
    logOperator = `${userName}（${account}）`


    if (!taskId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'taskId is empty')
      return
    }
    taskId = taskId.toString()
    let cfg = await companyCfgService.getCfgByCompanyId(companyId)
    if (!cfg) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, '未找到对应的租户关系配置')
      return
    }
    if (!datas || datas.length <= 0) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, '请选择同步范围')
      return
    }

    logDeptCount = datas.filter(data => {
      if (data.did.startsWith(fullSyncScopeService.CUR_DEPT_PREFIX)) {
        return false
      }
      return true
    }).length

    await fullSyncScopeService.saveCheckList(cfg, taskId, datas, userId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success')
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.FULL_SYNC_SCOPE_SET).detailCallback(logDeptCount, true, logOperator)
    logService.logSuccess(ctx, AdminOperationTypeEnum.FULL_SYNC_SCOPE_SET, detail)
  } catch (err) {
    log.i(err);
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.FULL_SYNC_SCOPE_SET).detailCallback(logDeptCount, false, logOperator)
    logService.logError(ctx, AdminOperationTypeEnum.FULL_SYNC_SCOPE_SET, err, detail)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
