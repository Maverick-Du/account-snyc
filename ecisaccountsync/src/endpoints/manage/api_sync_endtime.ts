import { Result } from '../../common/type';
import admin from "../../modules/admin";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.get('/api/manage/sync/endtime', async (ctx: Context) => {
  try {
    const companyId = ctx.state.companyId
    const timeResult = await admin.getSyncConfig(companyId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', timeResult)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
