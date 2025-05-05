import {log, Ticker} from '../../cognac/common';
import {
  IDeleteDepartmentTreeContext,
  IDeleteDepartmentTreeResult,
  IDeleteDepartmentTreeStrategy,
  SyncStrategyType,
  SyncEngine,
  SyncTask,
  LocalDepartment,
  IMoveDepartmentTreeContext,
  IMoveDepartmentTreeResult,
  WPSDepartment,
  DeleteDepartmentAction,
} from '../sync'
import {SyncDeptDeleteDepartmentTreeAction} from "../sync/engine/actions/SyncDeptDeleteDepartmentTreeAction";

/**
 * 删除部门树
 * 需要考虑：
 * 1. 部门是不是被挪到其他地方了
 *  1.1 如果挪到的地方，已经创建，可以执行挪动
 *  1.2 如果挪到的地方，没有创建，
 */
export class SyncDeptDeleteDepartmentTreeStrategy implements IDeleteDepartmentTreeStrategy {
  name: string = SyncStrategyType.SyncDeptDeleteDepartmentTree

  async exec(ctx: IDeleteDepartmentTreeContext): Promise<IDeleteDepartmentTreeResult> {
    const { task, dept, engine } = ctx
    const tick = new Ticker()

    // 1. 判断是否挪走了
    const ld = await engine.las.getDepartment(task.originTaskId, task.cfg.thirdCompanyId, dept.third_platform_id, dept.third_dept_id)
    if (ld != null) {
      // 如果在local表中存在，表示此部门是被挪走的
      // 有可能挪去的地方还未完成创建，所以先创建目录，在来挪动树。
      // const wpd = await this.makeSureParentExists(engine, task, dept, ld)
      log.i({ info: `full sync ${task.taskId} syncDept deleteDeptTree moveDeptTree deptName: ${dept.name}, deptId: ${dept.dept_id}}]` })
      const res = await this.moveDepartmentTree(engine, task, null, dept, ld)
      log.i({ info: `full sync ${task.taskId} syncDept deleteDeptTree moveDeptTree deptName: ${dept.name}, deptId: ${dept.dept_id} success[${tick.end()}]` })
      return res
    }

    // 2. 把删除自己的动作压入栈里，等待子目录完成后执行删除。
    task.push(new DeleteDepartmentAction(dept))

    // 3. 处理子部门的删除
    await this.deleteChildren(engine, task, dept)
    return { code: 'ok' }
  }

  async moveDepartmentTree(engine:SyncEngine, task:SyncTask, parent:WPSDepartment, dept:WPSDepartment, from:LocalDepartment) {
    const ctx:IMoveDepartmentTreeContext = {
      engine, task, parent, dept, from
    }
    return engine.sm.exec<IMoveDepartmentTreeResult>(SyncStrategyType.SyncDeptMoveDepartmentTree, ctx)
  }

  async deleteChildren(engine:SyncEngine, task:SyncTask, dept:WPSDepartment) {
    // 遍历子部门，一个一个删除树
    const subs = await engine.was.listDepartments(dept.company_id, dept)
    for (const sub of subs) {
      task.push(new SyncDeptDeleteDepartmentTreeAction(sub))
    }
  }
}
