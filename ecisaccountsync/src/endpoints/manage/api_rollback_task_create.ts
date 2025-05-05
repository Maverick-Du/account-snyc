import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { parse } from 'date-fns';
import { getOriginTaskId } from '../../common/util';
import logService from '../../modules/admin/log';
import {FullSyncCommon} from "../../modules/sync/types";
import { AdminOperationTypeEnum, OPERATION_MAP } from '../../modules/audit/type';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/rollback/task/create', async (ctx: Context) => {
  let logTaskId = ''
  let logOperator = ''
  try {
    let taskId = ctx.request.body?.taskId
    let userName = ctx.state.userName
    let account = ctx.state.account
    let companyId = ctx.state.companyId
    logOperator = `${userName}（${account}）`

    if (!taskId || taskId === '' ) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'taskId is empty')
      return
    }

    taskId = taskId.toString()
    let date = parse(getOriginTaskId(taskId), FullSyncCommon.TASK_ID_FORMAT, new Date())
    if (date.toString() === 'Invalid Date') {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, `taskId format not ${FullSyncCommon.TASK_ID_FORMAT}`)
      return
    }
    logTaskId = taskId

    // TODO：日志审计操作
    // 创建回滚任务
    const extraTaskId = await admin.createRollbackTask(taskId, companyId, account, userName)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success', { taskId: extraTaskId })
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.ROLLBACK_FULL_SYNC_TASK).detailCallback(extraTaskId, true, logOperator)
    logService.logSuccess(ctx, AdminOperationTypeEnum.ROLLBACK_FULL_SYNC_TASK, detail)
  } catch (err) {
    log.error(err)
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.ROLLBACK_FULL_SYNC_TASK).detailCallback(logTaskId, true, logOperator)
    logService.logError(ctx, AdminOperationTypeEnum.ROLLBACK_FULL_SYNC_TASK, err, detail)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
