import { Result } from '../../common/type';
import admin from "../../modules/admin";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/rollback/task/list', async (ctx: Context) => {
  try {
    let companyId = ctx.state.companyId
    let offset = ctx.request.body?.offset as number
    let limit = ctx.request.body?.limit as number
    if (offset === undefined) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'offset is empty')
      return
    }
    if (!/^(0|[1-9]\d*)$/.test(String(offset))) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'offset is invalid')
      return
    }
    if (limit === undefined) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'limit is empty')
      return
    }
    if (!/^(0|[1-9]\d*)$/.test(String(limit))) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'limit is invalid')
      return
    }

    // 查询回滚任务列表
    const data = await admin.getRollbackTaskList(companyId, offset, limit)
    ctx.body = new Result(Result.SUCCESS_CODE,'success', data)

  } catch (err) {
    log.error(err)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
