import { Result } from '../../common/type';
import fullSyncDelThresholdService from '../../modules/service/FullSyncDelThresholdService'
import config from "../../common/config";
import {FullSyncDelThreshold} from "../../modules/db/tables/FullSyncDelThreshold";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.get('/api/manage/fullsync/threshold/query', async (ctx: Context) => {
  try {
    let companyId = ctx.state.companyId
    if (!companyId) {
      ctx.body = new Result(Result.FAIL_CODE, "获取当前用户信息失败")
      return ctx
    }
    let data = await fullSyncDelThresholdService.getConfig(companyId)
    if (!data) {
      data = {
        company_id: companyId,
        user_del: config.threshold.userDel,
        dept_del: config.threshold.deptDel,
        dept_user_del: config.threshold.deptUserDel,
      } as FullSyncDelThreshold
      await fullSyncDelThresholdService.addConfig(companyId, data.user_del, data.dept_del, data.dept_user_del)
    }
    ctx.body = new Result(Result.SUCCESS_CODE, "success", data)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
