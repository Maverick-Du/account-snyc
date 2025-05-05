import { Result } from '../../common/type';
import fullSyncScopeService from '../../modules/service/FullSyncScopeService'
import companyCfgService from '../../modules/companyCfg/CompanyCfgService'
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.get('/api/manage/fullsync/scope/query', async (ctx: Context) => {
  try {
    let task_id = ctx.request.query.task_id
    let platform_id = ctx.request.query.platform_id
    let did = ctx.request.query.did
    let companyId = ctx.state.companyId

    task_id = task_id ? task_id.toString() : null
    platform_id = platform_id ? platform_id.toString() : null
    did = did ? did.toString() : null

    let cfg = await companyCfgService.getCfgByCompanyId(companyId)
    if (!cfg) {
      // 状态码改为200，前端特殊处理不弹toast
      ctx.body = new Result(Result.SUCCESS_CODE, '未找到对应的租户关系配置')
      return
    }

    ctx.body = await fullSyncScopeService.getScopeList(cfg, platform_id, did, task_id)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
