import { Result } from '../../common/type';
import {companyCfgService} from "../../modules/companyCfg";
import syncJobSettingService from "../../modules/service/SyncJobSettingService";
import {ScheduleJobType} from "../../modules/schedule/ScheduleService";
import increment_sync from "../../modules/increment_sync";
import {lockService} from "../../modules/lock";
import {LockKey} from "../../modules/lock/LockService";
import { log } from '../../sdk/cognac/common';
import {Context, root} from '../../sdk/cognac/server';

root.post('/open/v7/ecisaccountsync/increment/sync', async (ctx: Context) => {
    try {
        const { third_company_id } = ctx.request.body
        log.i({info: `receive request /api/increment/sync. third_company_id: ${third_company_id}`})
        if (!third_company_id) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "third_company_id is empty")
            return ctx
        }
        let cfg = await companyCfgService.getCfgByThirdCompanyId(third_company_id)
        if (!cfg) {
            ctx.body = new Result(Result.FAIL_CODE, `未找到对应的tb_company_cfg配置, third_company_id: ${third_company_id}`)
            return ctx
        }
        let conf = await syncJobSettingService.getSyncConfig(cfg.companyId, ScheduleJobType.INCREMENT_SYNC_JOB)
        if (!conf) {
            ctx.body = new Result(Result.FAIL_CODE, `not found schedule job config, third_company_id: ${third_company_id}`)
            return ctx
        }
        let lockKey = `${LockKey.BATCH_SYNC}_${cfg.companyId}`
        let lock = await lockService.getLock(lockKey)
        if (lock) {
            ctx.body = new Result(Result.FAIL_CODE, `已有同步任务在执行中, third_company_id: ${third_company_id}`)
            return ctx
        }
        increment_sync.start(cfg, conf.sync_time)
        ctx.body = new Result(Result.SUCCESS_CODE, "success")
    } catch (err) {
        log.i(`/api/increment/sync throw error. url: ${ctx.request.originalUrl}`, err)
        ctx.body = new Result(Result.FAIL_CODE, err.message)
    }
    return ctx
})
