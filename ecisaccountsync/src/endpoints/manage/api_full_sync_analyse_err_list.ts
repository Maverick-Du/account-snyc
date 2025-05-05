import { Result } from '../../common/type';
import statisticAnalyse from '../../modules/full_sync_statistic_analyse/manage_admin';
import { parse } from 'date-fns';
import { getOriginTaskId } from '../../common/util';
import {FullSyncCommon} from "../../modules/sync/types";
import { StatisticAnalyseErrType, StatisticAnalyseTbType, StatisticAnalyseOperateType } from '../../modules/db/types';
import { ANALYSE_TB_TYPES, ANALYSE_ERR_TYPES, ANALYSE_OPERATE_TYPES, FULL_SYNC_UPDAET_TYPES } from '../constant';
import {Context, root} from '../../sdk/cognac/server';
import { log } from '../../sdk/cognac/common';

root.post('/api/manage/fullsync/analyse/error/list', async (ctx: Context) => {
  try {
    let taskId = ctx.request.body?.task_id as string
    let offset = ctx.request.body?.offset as number
    let limit = ctx.request.body?.limit as number
    let syncTbType = ctx.request.body?.sync_tb_type as StatisticAnalyseTbType
    let operateType = ctx.request.body?.operate_type as StatisticAnalyseOperateType
    let errType = ctx.request.body?.err_type as StatisticAnalyseErrType
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
    // if (offset === undefined || limit === undefined) {
    //   ctx.body = new Result(Result.PARAM_ERROR_CODE, 'offset or limit is empty')
    //   return
    // }
    if (!(typeof offset === 'number' && offset >= 0)) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'offset is invalid')
      return
    }
    if (!(typeof limit === 'number' && limit >= 0)) {
      ctx.body = new Result(Result.PARAM_ERROR_CODE, 'limit is invalid')
      return
    }
    if (syncTbType && ANALYSE_TB_TYPES.indexOf(syncTbType) === -1) {
      return ctx.body = new Result(Result.PARAM_ERROR_CODE, `sync_tb_type is invalid, right type: [${ANALYSE_TB_TYPES.join(" | ")}]，current type: ${syncTbType}`)
    }
    if (operateType && ANALYSE_OPERATE_TYPES.indexOf(operateType) === -1) {
      return ctx.body = new Result(Result.PARAM_ERROR_CODE, `operate_type is invalid, right type: [${ANALYSE_OPERATE_TYPES.join(" | ")}]，current type: ${operateType}`)
    }
    if (errType && ANALYSE_ERR_TYPES.indexOf(errType) === -1) {
      return ctx.body = new Result(Result.PARAM_ERROR_CODE, `err_type is invalid, right type: [${ANALYSE_ERR_TYPES.join(" | ")}]，current type: ${errType}`)
    }

    const data = await statisticAnalyse.queryFullSyncAnalyseErrList(companyId, taskId, offset, limit, {
      sync_tb_type: syncTbType,
      operate_type: operateType,
      err_type: errType,
    })

    ctx.body = new Result(Result.SUCCESS_CODE, 'success', data)
  } catch (err) {
    log.i(err);
    ctx.body = new Result(Result.FAIL_CODE, err.message)
  }
  return ctx
})
