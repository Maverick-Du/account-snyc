import { Result } from '../../common/type';
import statisticAnalyse from '../../modules/full_sync_statistic_analyse/manage_admin';
import { parse } from 'date-fns';
import { getOriginTaskId } from '../../common/util';
import {FullSyncCommon} from "../../modules/sync/types";
import { StatisticAnalyseOperateType, StatisticAnalyseTbType, StatisticAnalyseErrType, FullSyncUpdateType } from '../../modules/db/types';
import { ANALYSE_TB_TYPES, ANALYSE_ERR_TYPES, ANALYSE_OPERATE_TYPES, FULL_SYNC_UPDAET_TYPES } from '../constant';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/analyse/error/details', async (ctx: Context) => {
  try {
    let taskId = ctx.request.body?.task_id as string
    let offset = ctx.request.body?.offset as number
    let limit = ctx.request.body?.limit as number
    let syncTbType = ctx.request.body?.sync_tb_type as StatisticAnalyseTbType
    let updateType = ctx.request.body?.update_type as FullSyncUpdateType
    let errType = ctx.request.body?.err_type as StatisticAnalyseErrType
    let content = ctx.request.body?.content as string
    let companyId = ctx.state.companyId as string

    if (!taskId) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'task_id is empty')
      return
    }
    taskId = taskId.toString()
    let date = parse(getOriginTaskId(taskId), FullSyncCommon.TASK_ID_FORMAT, new Date())
    if (date.toString() === 'Invalid Date') {
        ctx.body = new Result(Result.PARAM_ERROR_CODE, `task_id format not ${FullSyncCommon.TASK_ID_FORMAT}`)
        return
    }
    if (!syncTbType) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'sync_tb_type is empty')
      return
    }
    if (!(typeof offset === 'number' && offset >= 0)) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'offset is invalid')
      return
    }
    if (!(typeof limit === 'number' && limit >= 0)) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'limit is invalid')
      return
    }
    if (ANALYSE_TB_TYPES.indexOf(syncTbType) === -1) {
      return ctx.body = new Result(Result.PARAM_ERROR_CODE, `sync_tb_type is invalid, right type: [${ANALYSE_TB_TYPES.join(" | ")}]，current type: ${syncTbType}`)
    }
    if (updateType && FULL_SYNC_UPDAET_TYPES.indexOf(updateType) === -1) {
      return ctx.body = new Result(Result.PARAM_ERROR_CODE, `operate_type is invalid, right type: [${ANALYSE_OPERATE_TYPES.join(" | ")}]，current type: ${updateType}`)
    }
    if (errType && ANALYSE_ERR_TYPES.indexOf(errType) === -1) {
      return ctx.body = new Result(Result.PARAM_ERROR_CODE, `err_type is invalid, right type: [${ANALYSE_ERR_TYPES.join(" | ")}]，current type: ${errType}`)
    }

    const data = await statisticAnalyse.queryFullSyncTaskErrDetails(taskId, companyId, offset, limit, {
      syncTbType: syncTbType,
      updateType: updateType,
      errType: errType,
      content: content
    })

    ctx.body = new Result(Result.SUCCESS_CODE, 'success', data)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
