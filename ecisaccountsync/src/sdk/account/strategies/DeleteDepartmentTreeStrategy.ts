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
  DeleteDepartmentTreeAction, DEFAULT_ROOT_DEPT_P_ID, IMoveDepartmentContext
} from '../sync'

/**
 * 删除部门树
 * 需要考虑：
 * 1. 部门是不是被挪到其他地方了
 *  1.1 如果挪到的地方，已经创建，可以执行挪动
 *  1.2 如果挪到的地方，没有创建，
 */
export class DeleteDepartmentTreeStrategy implements IDeleteDepartmentTreeStrategy {
  name: string = SyncStrategyType.DeleteDepartmentTree

  async exec(ctx: IDeleteDepartmentTreeContext): Promise<IDeleteDepartmentTreeResult> {
    const { task, dept, engine } = ctx
    const tick = new Ticker()

    // 1. 判断是否挪走了
    const ld = await engine.las.getDepartment(task.originTaskId, task.cfg.thirdCompanyId, dept.third_platform_id, dept.third_dept_id)
    if (ld != null) {
      // 如果在local表中存在，表示此部门是被挪走的
      // 有可能挪去的地方还未完成创建，所以先创建目录，在来挪动树。
      // const wpd = await this.makeSureParentExists(engine, task, dept, ld)
      log.i({ info: `full sync ${task.taskId} deleteDeptTree moveDeptTree deptName: ${dept.name}, deptId: ${dept.dept_id}}]` })
      const res = await this.moveDepartmentTree(engine, task, null, dept, ld)
      log.i({ info: `full sync ${task.taskId} deleteDeptTree moveDeptTree deptName: ${dept.name}, deptId: ${dept.dept_id} success[${tick.end()}]` })
      return res
    }

    // 2. 把删除自己的动作压入栈里，等待子目录完成后执行删除。
    task.push(new DeleteDepartmentAction(dept))

    // 3. 处理子部门的删除
    await this.deleteChildren(engine, task, dept)
    return { code: 'ok' }
  }

  async makeSureParentExists(engine:SyncEngine, task: SyncTask, dept: WPSDepartment, from:LocalDepartment) {
    let wpd:WPSDepartment = null
    const paths:LocalDepartment[] = []
    let lpd:LocalDepartment = await engine.las.getDepartment(task.originTaskId, task.cfg.thirdCompanyId, from.platform_id, from.pid)
    const lroot = await engine.las.root(from.task_id, from.third_company_id)
    let root = await engine.was.root(task.cfg.companyId)

    if (from.did === lroot.did) {
      throw new Error(`删除的部门为根部门, did: ${from.did}, deptId: ${dept.dept_id}`)
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
        throw new Error(`采集表部门数据是环状数据，请检查数据是否正确, did: ${lpd.did}`)
      }
      lpd = await engine.las.getDepartment(task.originTaskId, task.cfg.thirdCompanyId, lpd.platform_id, lpd.pid)
      if (!lpd) {
        throw new Error(`采集表中未找到该部门的父部门，did: ${lpd.did}, pid: ${lpd.pid}`)
      }
    }

    if (wpd === null) {
      return root
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
          throw new Error(`采集表部门数据是环状数据，请检查数据是否正确。did: ${lpd1.did}`)
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
          wpd1 = await engine.was.addDepartment(task.cfg.companyId, parent.dept_id, tempPath.platform_id, tempPath.did,`${tempPath.name}_${Date.now()}`, tempPath.order, tempPath.source, tempPath.type)
          log.i({ info: `full sync ${task.taskId} addDept deptName: ${tempPath.name}, deptId: ${tempPath.did} success` })
          parent = wpd1
          continue
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
    for (let i = 0; i < paths.length; i++) {
      wpd = await engine.was.addDepartment(task.cfg.companyId, wpd.dept_id, paths[i].platform_id, paths[i].did,i !== 0 ? paths[i].name : `${paths[i].name}_${Date.now()}`, paths[i].order, paths[i].source, paths[i].type)
      log.i({ info: `full sync ${task.taskId} addDept deptName: ${paths[i].name}, deptId: ${paths[i].did} success` })
    }
    return wpd
  }

  async moveDepartmentTree(engine:SyncEngine, task:SyncTask, parent:WPSDepartment, dept:WPSDepartment, from:LocalDepartment) {
    const ctx:IMoveDepartmentTreeContext = {
      engine, task, parent, dept, from
    }
    return engine.sm.exec<IMoveDepartmentTreeResult>(SyncStrategyType.MoveDepartmentTree, ctx)
  }

  async deleteChildren(engine:SyncEngine, task:SyncTask, dept:WPSDepartment) {
    // 遍历子部门，一个一个删除树
    const subs = await engine.was.listDepartments(dept.company_id, dept)
    for (const sub of subs) {
      task.push(new DeleteDepartmentTreeAction(sub))
    }
  }
}
