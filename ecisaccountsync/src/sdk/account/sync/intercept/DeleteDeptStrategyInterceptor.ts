import {
    IDeleteDepartmentContext, IDeleteDepartmentResult,
    IDeleteDepartmentStrategy,
    SyncStrategyType
} from "../engine";
import fullSyncTaskService from "../../../../modules/service/FullSyncTaskService";
import {log} from "../../../cognac/common";
import fullSyncRecordService from "../../../../modules/service/FullSyncRecordService";
import {FullSyncUpdateType, RecordStatus} from "../../../../modules/db/types";
import {TaskStopError} from "../../../../modules/sync/types";

export class DeleteDeptStrategyInterceptor implements IDeleteDepartmentStrategy {
    name: string = SyncStrategyType.DeleteDepartment
    strategy: IDeleteDepartmentStrategy

    async exec(ctx: IDeleteDepartmentContext): Promise<IDeleteDepartmentResult> {
        const { dept, task } = ctx
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
        try {
            let res = await this.strategy.exec(ctx)
            if (res.code == 'ok') {
                task.statistics.dept_delete++
                await fullSyncRecordService.addDeptRecord(task.taskId, dept, FullSyncUpdateType.DeptDel, RecordStatus.SUCCESS)
            } else {
                task.statistics.dept_delete_error++
                task.statistics.dept_error += 1
                await fullSyncRecordService.addDeptRecord(task.taskId, dept, FullSyncUpdateType.DeptDel, RecordStatus.FAIL, new Error(res.message))
            }
            return res
        } catch (e) {
            if (e instanceof TaskStopError) {
                throw e
            }
            e.msg = `full sync ${task.taskId} deleteDept throw error. did: ${dept.dept_id}, name: ${dept.name}`
            log.i(e)
            task.statistics.dept_delete_error += 1
            task.statistics.dept_error += 1
            await fullSyncRecordService.addDeptRecord(task.taskId, dept, FullSyncUpdateType.DeptDel, RecordStatus.FAIL, e)
            return { code: 'fail', message: e.message}
        }
    }

}
