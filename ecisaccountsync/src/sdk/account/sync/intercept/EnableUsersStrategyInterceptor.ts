import {log} from '../../../cognac/common'
import {SyncStrategyType} from '../engine'
import fullSyncTaskService from '../../../../modules/service/FullSyncTaskService'
import fullSyncRecordService from '../../../../modules/service/FullSyncRecordService'
import {FullSyncUpdateType, RecordStatus, StatisticAnalyseErrType, StatisticAnalyseTbType} from "../../../../modules/db/types";
import {TaskStopError} from "../../../../modules/sync/types";
import {IEnableUsersContext, IEnableUsersResult, IEnableUsersStrategy} from "../engine/strategies/EnableUsersStrategy";
import {FullSyncUserRecord} from "../../../../modules/db/tables/FullSyncUserRecord";
import v7ErrRespProcess from '../../../../modules/full_sync_statistic_analyse/v7ErrRespProcess';


export class EnableUsersStrategyInterceptor implements IEnableUsersStrategy {
    name: string = SyncStrategyType.EnableUsers
    strategy: IEnableUsersStrategy

    async exec(ctx: IEnableUsersContext): Promise<IEnableUsersResult> {
        const {task, users} = ctx
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
        try {
            let res = await this.strategy.exec(ctx)
            task.statistics.user_enable += users.length
            await fullSyncRecordService.addUserRecords(users.map(x => {
                return {
                    task_id: task.taskId,
                    company_id: x.company_id,
                    name: x.nick_name,
                    account: x.login_name,
                    platform_id: x.third_platform_id,
                    uid: x.third_union_id,
                    abs_path: "",
                    update_type: FullSyncUpdateType.UserEnable,
                    status: RecordStatus.SUCCESS,
                } as FullSyncUserRecord
            }))
            return res
        } catch (e) {
            if (e instanceof TaskStopError) {
                throw e
            }
            e.msg = `full sync ${task.taskId} enableUsers throw error.`
            log.i(e)
            task.statistics.user_enable_error += users.length
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
                    update_type: FullSyncUpdateType.UserEnable,
                    status: RecordStatus.FAIL,
                    msg: e.message?.substring(0,2000),
                    err_type: errType
                } as FullSyncUserRecord
            }))
            return { code: 'fail', message: e.message }
        }
    }
}
