import sync from '../modules/sync';
import { Result } from '../common/type';
import { parse } from 'date-fns';
import {FullSyncCommon} from "../modules/sync/types";
import {companyCfgService} from "../modules/companyCfg";
import { log } from '../sdk/cognac/common';
import {Context, root} from '../sdk/cognac/server';

root.post('/api/sync/all', async (ctx: Context) => {
    try {
        const taskId = ctx.request.query.taskId?.toString()
        const thirdCompanyId = ctx.request.query.thirdCompanyId?.toString()
        const collectCostStr = ctx.request.query.collectCost?.toString()
        log.i({info: `receive request /api/sync/all. taskId: ${taskId}, thirdCompanyId: ${thirdCompanyId}, collectCost: ${collectCostStr}`})
        if (!taskId) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "taskId is empty")
            return ctx
        }
        if (!thirdCompanyId) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "thirdCompanyId is empty")
            return ctx
        }
        if (!collectCostStr) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "collectCost is empty")
            return ctx
        }
        let collectCost = Number(collectCostStr)
        if (!collectCost) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "collectCost not number type")
            return ctx
        }
        let date = parse(taskId, FullSyncCommon.TASK_ID_FORMAT, new Date())
        if (!date || date.toString() === 'Invalid Date') {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, `taskId format not ${FullSyncCommon.TASK_ID_FORMAT}`)
            return ctx
        }
        let cfg = await companyCfgService.getCfgByThirdCompanyId(thirdCompanyId)
        if (!cfg) {
            ctx.body = new Result(Result.FAIL_CODE, `未找到对应的tb_company_cfg配置, third_company_id: ${thirdCompanyId}`)
            return ctx
        }
        ctx.body = await sync.fullSync(taskId, cfg, collectCost)
    } catch (err) {
        log.i(`/api/sync/all throw error. url: ${ctx.request.originalUrl}`, err)
        ctx.body = new Result(Result.FAIL_CODE, err.message)
    }
    return ctx
})
