import {LocalMemberMainEnum, SyncStrategyType} from "../../sync";
import fullSyncTaskService from "../../../../modules/service/FullSyncTaskService";
import {log} from "../../../cognac/common";
import {
    IUpdateDeptMemberContext, IUpdateDeptMemberResult,
    IUpdateDeptMemberStrategy
} from "../engine/strategies/UpdateDepartmentMemberStrategy";
import fullSyncRecordService from "../../../../modules/service/FullSyncRecordService";
import {FullSyncUpdateType, RecordStatus} from "../../../../modules/db/types";
import {TaskStopError} from "../../../../modules/sync/types";

export class UpdateDeptMemberStrategyInterceptor implements IUpdateDeptMemberStrategy {
    name: string = SyncStrategyType.UpdateDepartmentMember
    strategy: IUpdateDeptMemberStrategy

    async exec(ctx: IUpdateDeptMemberContext): Promise<IUpdateDeptMemberResult> {
        const { task, dept, user, from } = ctx
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
        task.statistics.sync_dept_user++
        try {
            let res = await this.strategy.exec(ctx)
            let isAdd = false
            if (from.order && user.order !== from.order) {
                isAdd = true
            }
            if (from.main === LocalMemberMainEnum.TRUE &&
                user.def_dept_id !== dept.dept_id) {
                isAdd = true
            }
            if (isAdd) {
                task.statistics.user_dept_update++
                await fullSyncRecordService.addDeptUserRecord(task.taskId, user, dept, FullSyncUpdateType.UserOrderOrMainDeptUpdate, RecordStatus.SUCCESS)
            }
            // if (from.order && user.order !== from.order) {
            //     task.statistics.dept_user_sort++
            //     await fullSyncRecordService.addDeptUserRecord(task.taskId, user, dept, FullSyncUpdateType.UserOrderUpdate, RecordStatus.SUCCESS)
            // }
            // if (from.main === LocalMemberMainEnum.TRUE &&
            //     user.def_dept_id !== dept.dept_id) {
            //     task.statistics.user_dept_update++
            //     await fullSyncRecordService.addDeptUserRecord(task.taskId, user, dept, FullSyncUpdateType.MainDeptUpdate, RecordStatus.SUCCESS)
            // }
            return res
        } catch (e) {
            if (e instanceof TaskStopError) {
                throw e
            }
            e.msg = `full sync ${task.taskId} updateDeptMember throw error.deptName: ${dept.name} deptId: ${dept.dept_id} userId: ${user.user_id}`
            log.i(e)
            let isAdd = false
            if (from.order && user.order !== from.order) {
                isAdd = true
            }
            if (from.main === LocalMemberMainEnum.TRUE &&
                user.def_dept_id !== dept.dept_id) {
                isAdd = true
            }
            if (isAdd) {
                task.statistics.user_dept_update_error++
                task.statistics.dept_user_error++
                await fullSyncRecordService.addDeptUserRecord(task.taskId, user, dept, FullSyncUpdateType.UserOrderOrMainDeptUpdate, RecordStatus.FAIL, e)
            }

            // if (from.order && user.order !== from.order) {
            //     task.statistics.dept_user_error++
            //     await fullSyncRecordService.addDeptUserRecord(task.taskId, user, dept, FullSyncUpdateType.UserOrderUpdate, RecordStatus.FAIL, e)
            // }
            // if (from.main === LocalMemberMainEnum.TRUE &&
            //     user.def_dept_id !== dept.dept_id) {
            //     task.statistics.dept_user_error++
            //     await fullSyncRecordService.addDeptUserRecord(task.taskId, user, dept, FullSyncUpdateType.MainDeptUpdate, RecordStatus.FAIL, e)
            // }
        }
    }

}
