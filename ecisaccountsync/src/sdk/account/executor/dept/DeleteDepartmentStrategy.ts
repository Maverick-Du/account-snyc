import {log, Ticker} from '../../../cognac/common';
import {
  IDeleteDepartmentContext,
  IDeleteDepartmentResult,
  IDeleteDepartmentStrategy,
  SyncEngine,
  SyncStrategyType,
  SyncTask,
  WPSDepartment,
  WPSMember,
} from '../../sync'
import {IDeleteDepartmentMemberContext} from "../../sync/engine/strategies/DeleteDepartmentMemberStrategy";

export class DeleteDepartmentStrategy implements IDeleteDepartmentStrategy {
  name: string = SyncStrategyType.DeleteDepartment

  async exec(ctx: IDeleteDepartmentContext): Promise<IDeleteDepartmentResult> {
    const { dept, engine, task } = ctx
    log.debug({
      info: `full sync ${task.taskId} deleteDept did: ${dept.dept_id}, name: ${dept.name} start`,
    })
    const tick = new Ticker()

    // 校验 采集表内该部门下是否有子部门
    let localChildDepts = await engine.las.listDepartments(task.originTaskId, task.cfg.thirdCompanyId, dept.third_platform_id, dept.third_dept_id, 0, 10)
    if (localChildDepts && localChildDepts.length > 0){
      log.i({
        info: `full sync ${task.taskId} deleteDept 采集表该部门下存在子部门，禁止删除，did: ${dept.third_dept_id}, childDeptId: ${localChildDepts[0].did}`
      })
      return { code: 'fail', message: '采集表该部门下存在子部门，禁止删除'}
    }
    // 校验 采集表内该部门下是否有成员
    let localDeptUsers = await engine.las.listDeptUsers(task.originTaskId, task.cfg.thirdCompanyId, dept.third_platform_id, dept.third_dept_id, 0, 10)
    if (localDeptUsers && localDeptUsers.length > 0){
      log.i({
        info: `full sync ${task.taskId} deleteDept 采集表该部门下存在成员，禁止删除，did: ${dept.third_dept_id}, uid: ${localDeptUsers[0].uid}`
      })
      return { code: 'fail', message: '采集表该部门下存在成员，禁止删除'}
    }

    // remove deptMembers
    const deptUsers = await engine.was.listUsersByDepartment(
        dept.company_id,
        dept,
    )

    let existUsers = await this.tryRemoveUsersFromDepartment(engine, task, dept, deptUsers)
    log.i({
      info: `full sync ${task.taskId} deleteDept did: ${
          dept.dept_id
      }, name: ${dept.name} removeUsersFromDepartment userLength: ${
          deptUsers.length
      } success[${tick.end()}]`,
    })

    let childDepts = await engine.was.listDepartments(dept.company_id, dept, 0, 10)

    if (existUsers.length == 0 && childDepts.length == 0) {
      // remove dept
      await engine.was.removeDepartment(dept.company_id, dept)
      log.i({
        info: `full sync ${task.taskId} deleteDept did: ${dept.dept_id}, name: ${
            dept.name
        } success[${tick.end()}]`,
      })
      return { code: 'ok' }
    } else {
      // 修改部门名称，避免影响新部门创建
      if (!dept.name.endsWith("(待删除)")) {
        await engine.was.updateDepartment(dept.company_id, dept, null, `${dept.name}(待删除)`, dept.order)
      }
      log.i({
        info: `full sync ${task.taskId} deleteDept did: ${dept.dept_id}, name: ${
            dept.name
        } failed[${tick.end()}], reason: dept exist users or childDepts`,
      })
      return { code: 'fail', message: '部门下存在禁用或自建用户，或者子部门删除失败'}
    }
  }

  async tryRemoveUsersFromDepartment(
    engine: SyncEngine,
    task: SyncTask,
    dept: WPSDepartment,
    users: WPSMember[],
  ) {
    const root = await engine.was.root(dept.company_id)
    let arr: WPSMember[] = []
    if (dept.dept_id === root.dept_id) return arr
    for (const user of users) {
      let res = await engine.sm.exec(SyncStrategyType.DeleteDepartmentMember, {
        engine,
        task,
        root,
        dept,
        user,
        diffRootMember: false
      } as IDeleteDepartmentMemberContext)
      if (res.code != 'ok') {
        arr.push(user)
      }
    }
    return arr
  }
}
