import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { IncrementSyncType } from '../../modules/admin/type';
import logService from '../../modules/admin/log';
import { AdminOperationTypeEnum, AuditIncrementRetryData, OPERATION_MAP } from '../../modules/audit/type';
import increment_sync from "../../modules/increment_sync";
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/incrementsync/task/retry', async (ctx: Context) => {
  let logData: AuditIncrementRetryData = {
    uid: '',
    uName: '',
    did: '',
    dName: ''
  }
  let logType = ''
  let logUpdateType = ''
  try {
    let id = ctx.request.body.id
    let type = ctx.request.body.type
    let companyId = ctx.state.companyId
    let userName = ctx.state.userName
    let account = ctx.state.account

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

    const { detailId, auditLogData, updateType } = await admin.incrementSyncTaskRetry(Number(id), type, companyId, `${userName}（${account}）`)
    logData = auditLogData
    logType = type
    logUpdateType = updateType
    ctx.body = await increment_sync.retry(companyId, detailId, type)
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.RETRY_INCREMENT_SYNC_TASK).detailCallback(auditLogData, updateType, type, true)
    logService.logSuccess(ctx, AdminOperationTypeEnum .RETRY_INCREMENT_SYNC_TASK, detail)
  } catch (err) {
    log.i(err);
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.RETRY_INCREMENT_SYNC_TASK).detailCallback(logData, logUpdateType, logType, false)
    logService.logError(ctx, AdminOperationTypeEnum .RETRY_INCREMENT_SYNC_TASK, err, detail)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
