import {log, Ticker} from '../../cognac/common';
import {
  IAddDepartmentTreeContext,
  IAddDepartmentTreeResult,
  IAddDepartmentTreeStrategy,
  IAddDepartmentContext,
  SyncStrategyType,
  IAddDepartmentResult,
  SyncEngine,
  LocalDepartment,
  WPSDepartment,
  SyncTask,
  IMoveDepartmentTreeContext,
  IMoveDepartmentTreeResult,
  AddDepartmentTreeAction, IDiffDepartmentMembersContext
} from '../sync'

/**
 * 对父部门添加一棵子树
 * 有可能这个子树是从其他地方挪动过来的，也可能是新增的
 */
export class AddDepartmentTreeStrategy implements IAddDepartmentTreeStrategy {
  name: string = SyncStrategyType.AddDepartmentTree

  async exec(ctx: IAddDepartmentTreeContext): Promise<IAddDepartmentTreeResult> {
    const { engine, task, parent, dept } = ctx
    const tick = new Ticker()

    // 1. 判断是否为移动
    let wd = await engine.was.queryDeptsByThirdUnionId(parent.company_id, dept.platform_id, dept.did)
    if (wd != null) {
      // 1.1 挪动的，挪移一颗树过来
      const re = await this.moveDepartmentTree(engine, task, parent, wd, dept)
      log.i({ info: `full sync ${task.taskId} addDeptTree.moveDepartment wParentId: ${parent.dept_id}  lDeptId: ${dept.did} deptName: ${dept.name} success[${tick.end()}]` })
      return re
    }

    // 2 新增的
    let res = await this.addDepartment(engine, task, parent, dept)

    if (res.code && res.code == "ok") {
      wd = res.dept
      await this.syncChildren(engine, task, wd, dept)
    }

    return { code: 'ok' }
  }

  async addDepartment(engine:SyncEngine, task: SyncTask, parent:WPSDepartment, dept:LocalDepartment) {
    const ctx:IAddDepartmentContext = { engine, parent, dept, task }
    let re = await engine.sm.exec<IAddDepartmentResult>(SyncStrategyType.AddDepartment, ctx)

    if (re.code == 'ok' && re.dept) {
      // sync dept member
      await engine.sm.exec(SyncStrategyType.DiffDepartmentMembers, {
        engine,
        dept: re.dept,
        from: dept,
        task,
        diffRootMember: false
      } as IDiffDepartmentMembersContext)
    }
    return re
  }

  async moveDepartmentTree(engine:SyncEngine, task:SyncTask, parent:WPSDepartment, dept:WPSDepartment, from:LocalDepartment) {
    const ctx:IMoveDepartmentTreeContext = {
      engine, task, parent, dept, from
    }
    return engine.sm.exec<IMoveDepartmentTreeResult>(SyncStrategyType.MoveDepartmentTree, ctx)
  }

  async syncChildren(engine:SyncEngine, task:SyncTask, parent:WPSDepartment, dept:LocalDepartment) {
    // 遍历子部门，一个个添加
    const subs = await engine.las.listDepartments(task.originTaskId, task.cfg.thirdCompanyId, dept.platform_id, dept.did)
    for (const sub of subs) {
      task.push(new AddDepartmentTreeAction(parent, sub))
    }
  }
}
