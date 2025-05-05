import {log} from '../../../cognac/common'
import {SyncStrategyType} from '../engine'
import fullSyncTaskService from '../../../../modules/service/FullSyncTaskService'
import fullSyncRecordService from '../../../../modules/service/FullSyncRecordService'
import {FullSyncUpdateType, RecordStatus, StatisticAnalyseErrType, StatisticAnalyseTbType} from "../../../../modules/db/types";
import {TaskStopError} from "../../../../modules/sync/types";
import {FullSyncUserRecord} from "../../../../modules/db/tables/FullSyncUserRecord";
import {
    IDisableUsersContext,
    IDisableUsersResult,
    IDisableUsersStrategy
} from "../engine/strategies/DisableUsersStrategy";
import v7ErrRespProcess from '../../../../modules/full_sync_statistic_analyse/v7ErrRespProcess';


export class DisableUsersStrategyInterceptor implements IDisableUsersStrategy {
    name: string = SyncStrategyType.DisableUsers
    strategy: IDisableUsersStrategy

    async exec(ctx: IDisableUsersContext): Promise<IDisableUsersResult> {
        const {task, users, msg} = ctx
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
        try {
            let res = await this.strategy.exec(ctx)
            task.statistics.user_disable += users.length
            await fullSyncRecordService.addUserRecords(users.map(x => {
                return {
                    task_id: task.taskId,
                    company_id: x.company_id,
                    name: x.nick_name,
                    account: x.login_name,
                    platform_id: x.third_platform_id,
                    uid: x.third_union_id,
                    abs_path: "",
                    update_type: FullSyncUpdateType.UserDisable,
                    status: RecordStatus.SUCCESS,
                    msg: msg,
                } as FullSyncUserRecord
            }))
            return res
        } catch (e) {
            if (e instanceof TaskStopError) {
                throw e
            }
            e.msg = `full sync ${task.taskId} disableUsers throw error.`
            log.i(e)
            task.statistics.user_disable_error += users.length
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
                    update_type: FullSyncUpdateType.UserDisable,
                    status: RecordStatus.FAIL,
                    msg: `${msg}, ${e.message?.substring(0,1000)}`,
                    err_type: errType,
                } as FullSyncUserRecord
            }))
            return { code: 'fail', message: e.message }
        }
    }
}
