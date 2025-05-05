import {Result} from '../../common/type';
import fullSyncTaskService from '../../modules/service/FullSyncTaskService'
import sync from "../../modules/sync";
import {FullSyncStatus} from "../../modules/db/types";
import {companyCfgService} from "../../modules/companyCfg";
import { AdminOperationTypeEnum, OPERATION_MAP } from '../../modules/audit/type';
import logService from '../../modules/admin/log';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/task/continue', async (ctx: Context) => {
  let logTaskId = ''
  try {
    let taskId = ctx.request.body.task_id
    let companyId = ctx.state.companyId
    let userName = ctx.state.userName

    if (!taskId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'taskId is empty')
      return
    }
    let cfg = await companyCfgService.getCfgByCompanyId(companyId)
    if (!cfg) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, `未找到对应的tb_company_cfg配置, companyId: ${companyId}`)
      return
    }
    taskId = taskId.toString()
    let task = await fullSyncTaskService.getTask(taskId, companyId)
    if (!task) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, `未找到对应的task, taskId: ${taskId}`)
      return
    }
    if (task.status != FullSyncStatus.SYNC_DEL_WARN && task.status != FullSyncStatus.SYNC_SCOPE_WARN) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, '该任务状态无法继续同步')
      return
    }
    let existTask = await fullSyncTaskService.checkTaskCanRun(task.id, companyId)
    if (existTask && existTask.length > 0) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, '已有其他任务成功执行，该任务无法继续同步')
      return
    }
    logTaskId = taskId

    await sync.continueSync(task, cfg, userName)
    ctx.body = new Result(Result.SUCCESS_CODE, 'success')
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.CONTINUE_FULL_SYNC_TASK).detailCallback(taskId, true)
    logService.logSuccess(ctx, AdminOperationTypeEnum.CONTINUE_FULL_SYNC_TASK, detail)
  } catch (err) {
    log.i(err);
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.CONTINUE_FULL_SYNC_TASK).detailCallback(logTaskId, false)
    logService.logError(ctx, AdminOperationTypeEnum.CONTINUE_FULL_SYNC_TASK, err, detail)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
