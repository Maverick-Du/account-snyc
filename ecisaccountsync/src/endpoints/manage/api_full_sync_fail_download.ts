import { Result } from '../../common/type';
import admin from "../../modules/admin";
import { parse } from 'date-fns';
import { getOriginTaskId } from '../../common/util';
import {FullSyncCommon} from "../../modules/sync/types";
import * as xlsx from 'xlsx'
import { AdminOperationTypeEnum, OPERATION_MAP } from '../../modules/audit/type';
import logService from '../../modules/admin/log';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.get('/api/manage/fullsync/fail/download', async (ctx: Context) => {
  let logTaskId = ''
  try {
    let taskId = ctx.request.query.taskId
    let companyId = ctx.state.companyId

    if (!taskId) {
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

    const workbook = await admin.fullSyncFailDetailDownload(companyId, taskId)
    ctx.set('Content-Type', 'application/octet-stream;charset=utf-8')
    ctx.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`【账号对接】全量同步异常数据详情-${taskId}`)}.xlsx`)
    ctx.status = 200
    ctx.body = xlsx.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer'
    })

    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.DOWNLOAD_FULL_SYNC_DETAIL).detailCallback(logTaskId, 'abnormal', true)
    logService.logSuccess(ctx, AdminOperationTypeEnum.DOWNLOAD_FULL_SYNC_DETAIL, detail)

    return ctx
  } catch (err) {
    log.i(err);
    let detail = OPERATION_MAP.get(AdminOperationTypeEnum.DOWNLOAD_FULL_SYNC_DETAIL).detailCallback(logTaskId, 'abnormal', false)
    logService.logError(ctx, AdminOperationTypeEnum.DOWNLOAD_FULL_SYNC_DETAIL, err, detail)
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
