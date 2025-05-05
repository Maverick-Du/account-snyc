import { Result } from '../../common/type';
import { parse } from 'date-fns';
import { getOriginTaskId } from '../../common/util';
import {FullSyncCommon} from "../../modules/sync/types";
import statisticAnalyse from '../../modules/full_sync_statistic_analyse/manage_admin';
import { companyCfgService } from '../../modules/companyCfg';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/analyse/start', async (ctx: Context) => {
  try {
    let taskId = ctx.request.body?.task_id as string
    let companyId = ctx.state.companyId as string
    let userId = ctx.state.userId as string
    let account = ctx.state.account as string

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
    let cfg = await companyCfgService.getCfgByCompanyId(companyId)
    if (!cfg) {
      ctx.body = new Result(Result.FAIL_CODE, `未找到对应的tb_company_cfg配置, companyId: ${companyId}`)
      return ctx
    }
    const data = await statisticAnalyse.startAnalyse(taskId, cfg, `${account}(${userId})`)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', data)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
