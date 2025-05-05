import {
    IAddDepartmentContext, IAddDepartmentResult,
    IMoveDepartmentContext, IMoveDepartmentResult,
    IMoveDepartmentStrategy, SyncEngine,
    SyncStrategyType, SyncTask
} from "../engine";
import fullSyncTaskService from "../../../../modules/service/FullSyncTaskService";
import {log} from "../../../cognac/common";
import fullSyncRecordService from "../../../../modules/service/FullSyncRecordService";
import {FullSyncUpdateType, RecordStatus} from "../../../../modules/db/types";
import {CommonErrorName, TaskStopError} from "../../../../modules/sync/types";
import {WPSDepartment} from "../was";
import {DEFAULT_ROOT_DEPT_P_ID, LocalDepartment} from "../las";

export class MoveDeptStrategyInterceptor implements IMoveDepartmentStrategy {
    name: string = SyncStrategyType.MoveDepartment
    strategy: IMoveDepartmentStrategy

    async exec(ctx: IMoveDepartmentContext): Promise<IMoveDepartmentResult> {
        let { engine, parent, dept, task } = ctx
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
        try {
            if (!parent) {
                const ld = await engine.las.getDepartment(task.originTaskId, task.cfg.thirdCompanyId, dept.third_platform_id, dept.third_dept_id)
                if (!ld) {
                    throw new Error(`采集表中未找到该部门，did: ${dept.third_dept_id}`)
                }
                parent = await this.makeSureParentExists(engine, task, dept, ld)
                ctx.parent = parent
            }
            let res = await this.strategy.exec(ctx)
            task.statistics.dept_move++
            await fullSyncRecordService.addDeptRecord(task.taskId, dept, FullSyncUpdateType.DeptMove, RecordStatus.SUCCESS)
            return res
        } catch (e) {
            if (e instanceof TaskStopError) {
                throw e
            }
            e.msg = `full sync ${task.taskId} moveDept throw error. did: ${dept.third_dept_id} deptName: ${dept.name} parentId: ${parent?.dept_id}`
            log.i(e)
            let d = {...dept}
            if (parent) {
                d.dept_pid = parent.dept_id
                d.abs_path = `${parent.abs_path}/${dept.name}`
            }
            task.statistics.dept_move_error++
            task.statistics.dept_error++
            await fullSyncRecordService.addDeptRecord(task.taskId, d, FullSyncUpdateType.DeptMove, RecordStatus.FAIL, e)
            return { code: 'fail', message: e.message}
        }
    }

    async makeSureParentExists(engine:SyncEngine, task: SyncTask, dept: WPSDepartment, from:LocalDepartment) {
        let wpd:WPSDepartment = null
        const paths:LocalDepartment[] = []
        let lpd:LocalDepartment = await engine.las.getDepartment(task.originTaskId, task.cfg.thirdCompanyId, from.platform_id, from.pid)
        const lroot = await engine.las.root(from.task_id, from.third_company_id)
        let root = await engine.was.root(task.cfg.companyId)

        if (from.did === lroot.did) {
            throw new TaskStopError(task.taskId, CommonErrorName.TaskError, `删除的部门为根部门, did: ${from.did}, deptId: ${dept.dept_id}`)
        }

        if (lpd == null) {
            throw new Error(`采集表中未找到该部门的父部门, did: ${from.did}, pid: ${from.pid}`)
        }

        if (from.pid === lroot.did) {
            return root
        }
        let didSet1 = new Set<string>()
        while (lpd.did !== lroot.did) {
            wpd = await engine.was.queryDeptsByThirdUnionId(task.cfg.companyId, lpd.platform_id, lpd.did)
            if (wpd != null) {
                break
            }
            paths.unshift(lpd)
            if (!didSet1.has(lpd.did)) {
                didSet1.add(lpd.did)
            } else {
                throw new TaskStopError(task.taskId, CommonErrorName.TaskError, `采集表部门数据是环状数据，请检查数据是否正确, did: ${lpd.did}`)
            }
            lpd = await engine.las.getDepartment(task.originTaskId, task.cfg.thirdCompanyId, lpd.platform_id, lpd.pid)
            if (!lpd) {
                throw new Error(`采集表中未找到该部门的父部门，did: ${lpd.did}, pid: ${lpd.pid}`)
            }
        }

        if (wpd === null) {
            wpd = root
        }
        // 当同链路的上级部门移动到下级部门下时，得先将下级部门向上移动
        const tempPaths:LocalDepartment[] = []
        if (wpd.id_path.indexOf(dept.dept_id) >= 0) {
            let lpd1 = await engine.las.getDepartment(task.originTaskId, task.cfg.thirdCompanyId, wpd.third_platform_id, wpd.third_dept_id)
            if (!lpd1) {
                throw new Error(`采集表中未找到对应的部门，dept_id: ${wpd.dept_id}, did: ${wpd.third_dept_id}`)
            }
            let didSet2 = new Set<string>()
            while (lpd1.did !== lroot.did) {
                if (lpd1.pid == DEFAULT_ROOT_DEPT_P_ID) {
                    throw new Error(`该部门的pid异常，did: ${lpd1.did}, pid: ${lpd1.pid}`)
                }
                tempPaths.unshift(lpd1)
                if (!didSet2.has(lpd1.did)) {
                    didSet2.add(lpd1.did)
                } else {
                    throw new TaskStopError(task.taskId, CommonErrorName.TaskError, `采集表部门数据是环状数据，请检查数据是否正确。did: ${lpd1.did}`)
                }
                lpd1 = await engine.las.getDepartment(task.originTaskId, task.cfg.thirdCompanyId, lpd1.platform_id, lpd1.pid)
                if (!lpd1) {
                    throw new Error(`采集表中未找到该部门的父部门，did: ${lpd1.did}, pid: ${lpd1.pid}`)
                }
            }
            let parent = root
            for (const tempPath of tempPaths) {
                let wpd1 = await engine.was.queryDeptsByThirdUnionId(task.cfg.companyId, tempPath.platform_id, tempPath.did)
                if (!wpd1) {
                    const ctx:IAddDepartmentContext = { engine, parent, dept: tempPath, task }
                    let re = await engine.sm.exec<IAddDepartmentResult>(SyncStrategyType.AddDepartment, ctx)
                    if (re.code == 'ok' && re.dept) {
                        wpd1 = re.dept
                        parent = wpd1
                        log.i({ info: `full sync ${task.taskId} moveDepartment addDept deptName: ${tempPath.name}, deptId: ${tempPath.did} success` })
                        continue
                    } else {
                        throw new Error(`移动部门时创建父部门失败，parent_id: ${parent.dept_id}, did: ${tempPath.did}`)
                    }
                }
                if (parent.dept_id != wpd1.dept_pid) {
                    const ctx: IMoveDepartmentContext = {
                        engine, parent: parent, dept: wpd1, task
                    }
                    await engine.sm.exec(SyncStrategyType.MoveDepartment, ctx)
                }
                parent = wpd1
            }
        }

        // 会存在同层级同名称的情况
        return this.createPath(engine, task, wpd, paths)
    }

    async createPath(engine:SyncEngine, task: SyncTask, parent:WPSDepartment, paths:LocalDepartment[]) {
        let wpd = parent
        for (const d of paths) {
            const ctx:IAddDepartmentContext = { engine, parent: wpd, dept: d, task }
            let re = await engine.sm.exec<IAddDepartmentResult>(SyncStrategyType.AddDepartment, ctx)
            if (re.code == 'ok' && re.dept) {
                wpd = re.dept
                log.i({ info: `full sync ${task.taskId} moveDepartment addDept deptName: ${d.name}, deptId: ${d.did} success` })
            } else {
                throw new Error(`移动部门时创建父部门失败，parent_id: ${wpd.dept_id}, did: ${d.did}`)
            }
        }
        return wpd
    }

}
