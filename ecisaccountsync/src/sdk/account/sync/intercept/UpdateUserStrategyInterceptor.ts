import {log} from '../../../cognac/common'
import {
    IUpdateUserContext, IUpdateUserResult, IUpdateUserStrategy,
    SyncStrategyType,
} from '../engine'
import fullSyncTaskService from '../../../../modules/service/FullSyncTaskService'
import fullSyncRecordService from '../../../../modules/service/FullSyncRecordService'
import {FullSyncUpdateType, RecordStatus} from "../../../../modules/db/types";
import {TaskStopError} from "../../../../modules/sync/types";


export class UpdateUserStrategyInterceptor implements IUpdateUserStrategy {
    name: string = SyncStrategyType.UpdateUser
    strategy: IUpdateUserStrategy

    async exec(ctx: IUpdateUserContext): Promise<IUpdateUserResult> {
        const {task, user, from} = ctx
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
        try {
            let res = await this.strategy.exec(ctx)
            task.statistics.sync_user++
            if (res.user) {
                task.statistics.user_update++
                await fullSyncRecordService.addUserRecord(task.taskId, user, FullSyncUpdateType.UserUpdate, RecordStatus.SUCCESS)
            } else {
                task.statistics.user_update_ignore++
            }
            return res
        } catch (e) {
            if (e instanceof TaskStopError) {
                throw e
            }
            e.msg = `full sync ${task.taskId} updateUser throw error. userId: ${user.user_id} fromId: ${from.uid}, account: ${user.login_name}`
            log.i(e)
            task.statistics.sync_user++
            task.statistics.user_update_error ++
            task.statistics.user_error += 1
            await fullSyncRecordService.addUserRecord(task.taskId, user, FullSyncUpdateType.UserUpdate, RecordStatus.FAIL, e)
            return {code: "fail", user: null}
        }
    }
}
