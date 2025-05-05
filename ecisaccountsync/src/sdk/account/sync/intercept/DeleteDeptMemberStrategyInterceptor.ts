import {SyncStrategyType} from "../engine";
import {
    IDeleteDepartmentMemberContext, IDeleteDepartmentMemberResult,
    IDeleteDepartmentMemberStrategy
} from "../engine/strategies/DeleteDepartmentMemberStrategy";
import fullSyncTaskService from "../../../../modules/service/FullSyncTaskService";
import {log} from "../../../cognac/common";
import fullSyncRecordService from "../../../../modules/service/FullSyncRecordService";
import {FullSyncUpdateType, RecordStatus} from "../../../../modules/db/types";
import {TaskStopError} from "../../../../modules/sync/types";
import {IDisableUsersContext} from "../engine/strategies/DisableUsersStrategy";

export class DeleteDeptMemberStrategyInterceptor implements IDeleteDepartmentMemberStrategy {
    name: string = SyncStrategyType.DeleteDepartmentMember
    strategy: IDeleteDepartmentMemberStrategy

    async exec(ctx: IDeleteDepartmentMemberContext): Promise<IDeleteDepartmentMemberResult> {
        const { engine, task, dept, user, diffRootMember } = ctx

        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)

        try {
            let res = await this.strategy.exec(ctx)
            if (res.code == 'ok') {
                task.statistics.dept_user_delete++
                await fullSyncRecordService.addDeptUserRecord(task.taskId, user, dept, FullSyncUpdateType.UserDeptDel, RecordStatus.SUCCESS)
            } else if (res.code == 'need_disable' && diffRootMember) {
                // 游离用户，因为没有部门了而挂在根部门下，需要禁用
                const ctx: IDisableUsersContext = {
                    engine,
                    task,
                    users: [user],
                    msg: res.message
                }
                await engine.sm.exec(SyncStrategyType.DisableUsers, ctx)
            }
            return res
        } catch (e) {
            if (e instanceof TaskStopError) {
                throw e
            }
            e.msg = `full sync ${task.taskId} deleteDeptMember removeUser throw error.deptName: ${dept.name} deptId: ${dept.dept_id} userId: ${user.user_id}`
            log.i(e)
            task.statistics.dept_user_delete_error++
            task.statistics.dept_user_error++
            await fullSyncRecordService.addDeptUserRecord(task.taskId, user, dept, FullSyncUpdateType.UserDeptDel, RecordStatus.FAIL, e)
            return {code: 'fail', message: e.message}
        }
    }

}
