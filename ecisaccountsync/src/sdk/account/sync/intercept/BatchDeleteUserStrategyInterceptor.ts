/* eslint-disable eqeqeq */

import {
  IBatchDeleteUserContext,
  IBatchDeleteUserResult,
  IBatchDeleteUserStrategy,
  SyncStrategyType,
} from '../engine'
import fullSyncTaskService from '../../../../modules/service/FullSyncTaskService'
import fullSyncRecordService from '../../../../modules/service/FullSyncRecordService'
import config from '../../../../common/config'
import {log} from '../../../cognac/common'
import {FullSyncUpdateType, RecordStatus, StatisticAnalyseErrType, StatisticAnalyseTbType} from "../../../../modules/db/types";
import {FullSyncUserRecord} from "../../../../modules/db/tables/FullSyncUserRecord";
import {TaskStopError} from "../../../../modules/sync/types";
import v7ErrRespProcess from '../../../../modules/full_sync_statistic_analyse/v7ErrRespProcess'

export class BatchDeleteUserStrategyInterceptor implements IBatchDeleteUserStrategy {
  name: string = SyncStrategyType.BatchDeleteUser
  strategy: IBatchDeleteUserStrategy

  async exec(ctx: IBatchDeleteUserContext): Promise<IBatchDeleteUserResult> {
    const { users, task } = ctx
    fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
    try {
      let res = await this.strategy.exec(ctx)
      task.statistics.user_delete += users.length
      await fullSyncRecordService.addUserRecords(users.map(x => {
        return {
          task_id: task.taskId,
          company_id: x.company_id,
          name: x.nick_name,
          account: x.login_name,
          platform_id: x.third_platform_id,
          uid: x.third_union_id,
          abs_path: "",
          update_type: FullSyncUpdateType.UserDel,
          status: RecordStatus.SUCCESS,
        } as FullSyncUserRecord
      }))
      return res
    } catch (e) {
      if (e instanceof TaskStopError) {
        throw e
      }
      e.msg = `full sync ${task.taskId} deleteUsers throw error. msg: ${e.message}`
      log.i(e)
      task.statistics.user_delete_error += users.length
      task.statistics.user_error += users.length
      let errType: StatisticAnalyseErrType
      errType = v7ErrRespProcess.errProcess(StatisticAnalyseTbType.User, e)
      await fullSyncRecordService.addUserRecords(users.map(x => {
        return {
          task_id: task.taskId,
          company_id: x.company_id,
          name: x.nick_name,
          account: x.login_name,
          platform_id: x.third_platform_id,
          uid: x.third_union_id,
          abs_path: "",
          update_type: FullSyncUpdateType.UserDel,
          status: RecordStatus.FAIL,
          msg: e.message?.substring(0,2000),
          err_type: errType
        } as FullSyncUserRecord
      }))
      return {code: "fail", message: e.message}
    }
  }

  // 分批操作
  async groupOpt<T>(
    data: T[],
    func: { (objectGroup: T[]): Promise<void> },
    groupSize: number = config.groupSize
  ) {
    const groupList = this.averageList(data, groupSize)
    for (const objectGroup of groupList) {
      await func(objectGroup)
    }
  }

  averageList<T>(list: T[], groupSize: number = config.groupSize): T[][] {
    const groupList: T[][] = []
    let start = 0
    let end = 0

    while (start < list.length) {
      end = start + groupSize
      if (end > list.length) {
        end = list.length
      }

      const objectGroup = list.slice(start, end)
      groupList.push(objectGroup)
      start = end
    }
    return groupList
  }
}
