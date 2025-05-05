import {IAddDepartmentContext, IAddDepartmentResult, IAddDepartmentStrategy, SyncStrategyType} from "../engine";
import fullSyncTaskService from "../../../../modules/service/FullSyncTaskService";
import {WPSDepartment} from "../was";
import fullSyncRecordService from "../../../../modules/service/FullSyncRecordService";
import {FullSyncUpdateType, RecordStatus} from "../../../../modules/db/types";
import {TaskStopError} from "../../../../modules/sync/types";
import { log } from "../../../cognac/common";

export class AddDeptStrategyInterceptor implements IAddDepartmentStrategy {
    name: string = SyncStrategyType.AddDepartment
    strategy: IAddDepartmentStrategy

    async exec(ctx: IAddDepartmentContext): Promise<IAddDepartmentResult> {
        const { parent, dept, task } = ctx
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
        try {
            let res = await this.strategy.exec(ctx)
            task.statistics.sync_dept_set.add(res.dept.dept_id)
            task.statistics.dept_add++
            await fullSyncRecordService.addDeptRecord(task.taskId, res.dept, FullSyncUpdateType.DeptAdd, RecordStatus.SUCCESS)
            return res
        } catch (e) {
            if (e instanceof TaskStopError) {
                throw e
            }
            e.msg = `full sync ${task.taskId} addDept throw error. did: ${dept.did}, name: ${dept.name}`
            log.i(e)
            task.statistics.dept_add_error += 1
            task.statistics.dept_error += 1
            let wd = {
                company_id: task.cfg.companyId,
                name: dept.name,
                third_platform_id: dept.platform_id,
                third_dept_id: dept.did,
                dept_id: '',
                dept_pid: parent.dept_id,
                abs_path: `${parent.abs_path}/${dept.name}`
            } as WPSDepartment
            await fullSyncRecordService.addDeptRecord(task.taskId, wd, FullSyncUpdateType.DeptAdd, RecordStatus.FAIL, e)
            return { code: 'fail', dept: null }
        }
    }

}
