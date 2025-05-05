import {log} from '../../../cognac/common'
import {SyncStrategyType} from '../engine'
import fullSyncTaskService from '../../../../modules/service/FullSyncTaskService'
import fullSyncRecordService from '../../../../modules/service/FullSyncRecordService'
import {FullSyncUpdateType, RecordStatus} from "../../../../modules/db/types";
import {
    IJoinDeptMemberContext,
    IJoinDeptMemberResult,
    IJoinDeptMemberStrategy
} from "../engine/strategies/JoinDeptMemberStrategy";
import {TaskStopError} from "../../../../modules/sync/types";


export class JoinDeptMemberStrategyInterceptor implements IJoinDeptMemberStrategy {
    name: string = SyncStrategyType.JoinDepartmentMember
    strategy: IJoinDeptMemberStrategy

    async exec(ctx: IJoinDeptMemberContext): Promise<IJoinDeptMemberResult> {
        const {task, dept, wu} = ctx
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
        try {
            let res = await this.strategy.exec(ctx)
            task.statistics.sync_dept_user++
            task.statistics.dept_user_add++
            await fullSyncRecordService.addDeptUserRecord(task.taskId, wu, dept, FullSyncUpdateType.UserDeptAdd, RecordStatus.SUCCESS)
            return res
        } catch (e) {
            if (e instanceof TaskStopError) {
                throw e
            }
            e.msg = `full sync ${task.taskId} addUserToDepartment throw error. deptName: ${dept.name} deptId: ${dept.dept_id} userId: ${wu.user_id}`
            log.i(e)
            task.statistics.sync_dept_user++
            task.statistics.dept_user_add_error++
            task.statistics.dept_user_error++
            await fullSyncRecordService.addDeptUserRecord(task.taskId, wu, dept, FullSyncUpdateType.UserDeptAdd, RecordStatus.FAIL, e)
        }
    }
}
