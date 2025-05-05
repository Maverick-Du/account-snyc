import {log, Ticker} from '../../cognac/common';
import {
  IMoveDepartmentContext,
  IMoveDepartmentTreeContext,
  IMoveDepartmentTreeResult,
  IMoveDepartmentTreeStrategy,
  IUpdateDepartmentPropertiesContext,
  LocalDepartment,
  SyncEngine,
  SyncMap,
  SyncStrategyType,
  SyncTask,
  WPSDepartment
} from '../sync'
import {SyncDeptDiffDepartmentTreeAction} from "../sync/engine/actions/SyncDeptDiffDepartmentTreeAction";
import {SyncDeptDeleteDepartmentTreeAction} from "../sync/engine/actions/SyncDeptDeleteDepartmentTreeAction";
import {SyncDeptAddDepartmentTreeAction} from "../sync/engine/actions/SyncDeptAddDepartmentTreeAction";

/**
 * 移动一棵树
 *
 *
 */
export class SyncDeptMoveDepartmentTreeStrategy implements IMoveDepartmentTreeStrategy {
  name: string = SyncStrategyType.SyncDeptMoveDepartmentTree

  async exec(ctx: IMoveDepartmentTreeContext): Promise<IMoveDepartmentTreeResult> {
    const { engine, task, parent, dept, from } = ctx
    const tick = new Ticker()
    log.debug({ info: `full sync ${task.taskId} syncDept moveDeptTree deptId: ${dept.dept_id} deptName: ${dept.name} parentId: ${parent?.dept_id} start` })
    // 1. 先挪动树
    if (dept.dept_pid != parent?.dept_id) {
        await this.moveDepartment(engine, task, parent, dept)
        log.debug({ info: `full sync ${task.taskId} syncDept moveDeptTree deptId: ${dept.dept_id} deptName: ${dept.name} parentId: ${parent?.dept_id} success[${tick.end()}]` })
    }
    // 2. 再更新属性
    await this.updateDepartment(engine, task, dept, from)
    log.debug({ info: `full sync ${task.taskId} syncDept moveDeptTree.updateDepartment deptId: ${dept.dept_id} deptName: ${dept.name} fromId: ${from.did} success[${tick.end()}]` })

    // 3. 同步子目录
    await this.syncChildren(engine, task, dept, from)
    log.debug({ info: `full sync ${task.taskId} syncDept moveDeptTree.syncChildren deptId: ${dept.dept_id} deptName: ${dept.name} fromId: ${from.did} success[${tick.end()}]` })

    return { code: 'ok' }
  }

  async moveDepartment(
    engine: SyncEngine,
    task: SyncTask,
    parent: WPSDepartment,
    dept: WPSDepartment
  ) {
    const ctx: IMoveDepartmentContext = {
      engine, parent, dept, task
    }
    await engine.sm.exec(SyncStrategyType.MoveDepartment, ctx)
  }

  async updateDepartment(
    engine: SyncEngine,
    task: SyncTask,
    dept: WPSDepartment,
    from: LocalDepartment
  ) {
    const ctx: IUpdateDepartmentPropertiesContext = {
      engine, dept: dept, from: from, task
    }
    await engine.sm.exec(SyncStrategyType.UpdateDepartmentProperties, ctx)
  }

  async syncChildren(
    engine: SyncEngine,
    task: SyncTask,
    dept: WPSDepartment,
    from: LocalDepartment
  ) {
    const sDepts = await engine.las.listDepartments(from.task_id, from.third_company_id, from.platform_id, from.did)
    const dDetps = await engine.was.listDepartments(task.cfg.companyId, dept)

    log.i({ info: `full sync ${task.taskId} moveDeptTree syncChildren srcName: ${from.name} srcId: ${from.did}, lasDeptSize: ${sDepts.length}, wasDeptSize: ${dDetps.length}` })

    const tmps: SyncMap<LocalDepartment> = {}
    sDepts.forEach(x => (tmps[x.did] = x))

    const tempDelArr = []
    const tempDiffArr = []

    for (const dd of dDetps) {
      const sd = tmps[dd.third_dept_id]
      if (sd) {
        delete tmps[dd.third_dept_id]
        tempDiffArr.push(new SyncDeptDiffDepartmentTreeAction(sd, dd))
      } else {
        tempDelArr.push(new SyncDeptDeleteDepartmentTreeAction(dd))
      }
    }

    for (const add of Object.values(tmps)) {
      task.push(new SyncDeptAddDepartmentTreeAction(dept, add))
    }
    log.debug({ info: `full sync ${task.taskId} moveDeptTree syncChildren AddDepartmentTreeAction Length: ${Object.values(tmps).length}` })

    for (const diff of tempDiffArr) {
      task.push(diff)
    }
    log.debug({ info: `full sync ${task.taskId} moveDeptTree syncChildren DiffDepartmentTreeAction Length: ${tempDiffArr.length}` })

    for (const del of tempDelArr) {
      task.push(del)
    }
    log.debug({ info: `full sync ${task.taskId} moveDeptTree syncChildren DeleteDepartmentTreeAction Length: ${tempDelArr.length}` })
  }
}
