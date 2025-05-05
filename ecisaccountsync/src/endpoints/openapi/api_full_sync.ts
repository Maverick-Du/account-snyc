import sync from '../../modules/sync';
import { log } from '../../sdk/cognac/common';
import { Result } from '../../common/type';
import {Context, root} from '../../sdk/cognac/server';
import { parse } from 'date-fns';
import { FullSyncCommon } from "../../modules/sync/types";
import { companyCfgService } from "../../modules/companyCfg";

root.post('/open/v7/ecisaccountsync/full/sync', async (ctx: Context) => {
  try {
    const taskId = ctx.request.body.task_id?.toString()
    const thirdCompanyId = ctx.request.body.third_company_id?.toString()
    const collectCostStr = ctx.request.body.collect_cost?.toString()
    log.i({ info: `receive openapi request /open/v7/ecisaccountsync/full/sync. taskId: ${taskId}, thirdCompanyId: ${thirdCompanyId}, collectCost: ${collectCostStr}` })
    if (!taskId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, "task_id is empty")
      return ctx
    }
    if (!thirdCompanyId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, "third_company_id is empty")
      return ctx
    }
    if (!collectCostStr) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, "collect_cost is empty")
      return ctx
    }
    let collectCost = Number(collectCostStr)
    if (!collectCost) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, "collect_cost not number type")
      return ctx
    }
    let date = parse(taskId, FullSyncCommon.TASK_ID_FORMAT, new Date())
    if (!date || date.toString() === 'Invalid Date') {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, `task_id format not ${FullSyncCommon.TASK_ID_FORMAT}`)
      return ctx
    }
    let cfgMaps = await companyCfgService.loadCfgsMap()
    let cfg = cfgMaps.get(thirdCompanyId)
    if (!cfg) {
      ctx.body = new Result(Result.FAIL_CODE, `未找到对应的tb_company_cfg配置, third_company_id: ${thirdCompanyId}`)
      return ctx
    }
    ctx.body = await sync.fullSync(taskId, cfg, collectCost)
  } catch (err) {
    log.i(`/open/v7/ecisaccountsync/full/sync throw error. url: ${ctx.request.originalUrl}`, err)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})