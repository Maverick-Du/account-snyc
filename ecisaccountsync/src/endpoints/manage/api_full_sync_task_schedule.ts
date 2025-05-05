import { Result } from '../../common/type';
import admin from "../../modules/admin";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.get('/api/manage/fullsync/schedule', async (ctx: Context) => {
  try {
    const companyId = ctx.state.companyId
    const data = await admin.getFullSyncConfig(companyId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', data)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
