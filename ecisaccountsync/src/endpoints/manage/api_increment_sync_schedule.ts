import { Result } from '../../common/type';
import admin from "../../modules/admin";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.get('/api/manage/incrementsync/schedule', async (ctx: Context) => {
  try {
    let companyId: string = ctx.state.companyId
    const detailData = await admin.getIncrementSyncConfig(companyId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', detailData)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
