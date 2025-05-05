import {
    IUpdateDepartmentPropertiesContext,
    IUpdateDepartmentPropertiesResult,
    IUpdateDepartmentPropertiesStrategy,
    SyncStrategyType
} from "../engine";
import fullSyncTaskService from "../../../../modules/service/FullSyncTaskService";
import {log} from "../../../cognac/common";
import fullSyncRecordService from "../../../../modules/service/FullSyncRecordService";
import {FullSyncUpdateType, RecordStatus} from "../../../../modules/db/types";
import {TaskStopError} from "../../../../modules/sync/types";

export class UpdateDeptPropertiesStrategyInterceptor implements IUpdateDepartmentPropertiesStrategy {
    name: string = SyncStrategyType.UpdateDepartmentProperties
    strategy: IUpdateDepartmentPropertiesStrategy

    async exec(ctx: IUpdateDepartmentPropertiesContext): Promise<IUpdateDepartmentPropertiesResult> {
        const { dept, task } = ctx
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
        try {
            let res = await this.strategy.exec(ctx)
            if (res.code == 'ok') {
                task.statistics.dept_update_set.add(dept.dept_id)
                await fullSyncRecordService.addDeptRecord(task.taskId, res.dept, FullSyncUpdateType.DeptUpdate, RecordStatus.SUCCESS)
            } else if (res.code == 'ignore') {
                // 部门修改可能会重复，忽略重复的部门
                if (!task.statistics.sync_dept_set.has(dept.dept_id)) {
                    task.statistics.dept_update_set_ignore.add(dept.dept_id)
                }
            }
            return res
        } catch (e) {
            if (e instanceof TaskStopError) {
                throw e
            }
            e.msg = `full sync ${task.taskId} updateDeptProperties throw error. deptName: ${dept.name} deptId: ${dept.dept_id}`
            log.i(e)
            task.statistics.dept_update_error++
            task.statistics.dept_error++
            await fullSyncRecordService.addDeptRecord(task.taskId, dept, FullSyncUpdateType.DeptUpdate, RecordStatus.FAIL, e)
            return { code: 'fail', message: e.message, dept: null}
        } finally {
            task.statistics.sync_dept_set.add(dept.dept_id)
        }
    }
}
