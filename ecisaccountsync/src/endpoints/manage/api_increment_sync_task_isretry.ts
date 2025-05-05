import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { IncrementSyncType } from '../../modules/admin/type';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/incrementsync/task/isretry', async (ctx: Context) => {
  try {
    let id = ctx.request.body.id
    let type = ctx.request.body.type
    let companyId = ctx.state.companyId

    if (!id) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'id is empty')
      return
    }
    id = id.toString()
    if (!type) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'type is empty')
      return
    }
    type = type.toString()
    if (!/^[1-9]\d*$/.test(id)) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'id format is invalid, must be a positive integer')
      return
    }
    if (type !== IncrementSyncType.DEPT && type !== IncrementSyncType.USER && type !== IncrementSyncType.USER_DEPT) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, `type format is invalid, right type: user | dept | user_dept, current type:  ${type}`)
      return
    }

    const isRetry = await admin.incrementSyncTaskIsRetry(Number(id), type, companyId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', { is_retry: isRetry })
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
