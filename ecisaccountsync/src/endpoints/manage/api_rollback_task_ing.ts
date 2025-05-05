import { Result } from '../../common/type';
import admin from "../../modules/admin";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.get('/api/manage/rollback/task/processing', async (ctx: Context) => {
  try {
    let companyId = ctx.state.companyId

    // TODO：日志审计操作
    // 创建回滚任务
    const data = await admin.getRollbackTaskIng(companyId)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', data)

  } catch (err) {
    log.error(err)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
