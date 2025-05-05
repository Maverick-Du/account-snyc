import {log, Ticker} from '../../cognac/common';
import {
  IDiffDepartmentMembersContext, IDiffDepartmentMembersResult,
  IDiffDepartmentMembersStrategy,
  LocalDepartment,
  LocalMember,
  SyncEngine,
  SyncStrategyType,
  SyncTask,
  WPSDepartment, WpsDeptAndLocalMember,
  WPSMember,
  WPSUser,
  WPSUserStatus
} from '../sync'
import config from '../../../common/config'
import fullSyncTaskService from '../../../modules/service/FullSyncTaskService'

export class DiffDepartmentMembersStrategy
  implements IDiffDepartmentMembersStrategy
{
  name: string = SyncStrategyType.DiffDepartmentMembers

  async exec(
    ctx: IDiffDepartmentMembersContext,
  ): Promise<IDiffDepartmentMembersResult> {
    const { engine, dept, from, task, diffRootMember } = ctx
    log.debug({
      info: `full sync ${task.taskId} diffDeptMember start, deptName: ${dept.name},deptId: ${dept.dept_id},fromName: ${from.name},fromId: ${from.did}`,
    })
    const tick = new Ticker()

    const lMembers = await engine.las.listUsersByDepartment(from)
    const wMembers = await engine.was.listUsersByDepartment(
      dept.company_id,
      dept,
    )
    log.debug({
      info: `full sync ${task.taskId} diffDeptMember lMembersLength: ${
        lMembers.length
      } wMembersLength: ${wMembers.length} [${tick.end()}]`,
    })
    fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)

    let updateLength = 0
    let deleteLength = 0
    let addLength = 0
    const tmps: Map<string, LocalMember> = new Map<string, LocalMember>()

    lMembers.forEach((x) => tmps.set(x.uid, x))

    const root = await engine.was.root(dept.company_id)
    for (const wu of wMembers) {
      if (!wu.third_union_id || wu.third_union_id.length === 0) {
        continue
      }
      const lu = tmps.get(wu.third_union_id)
      if (lu != null) {
        tmps.delete(wu.third_union_id)
        await this.updateUser(engine, task, dept, wu, lu)
        updateLength++
      } else {
        await this.tryDeleteUser(engine, task, root, from.task_id, dept, wu, diffRootMember)
        deleteLength++
      }
    }
    let users = []
    for (const lu of tmps.values()) {
      users.push(lu)
    }
    await this.tryAddUsers(engine, task, dept, from, users)
    addLength += users.length

    log.i({
      info: `full sync ${task.taskId} diffDeptMember deptName: ${dept.name} deptId: ${
        dept.dept_id
      } addLength: ${addLength} deleteLength: ${deleteLength} updateLength: ${updateLength} success[${tick.end()}]`,
    })
    return { code: 'ok' }
  }

  async updateUser(
    engine: SyncEngine,
    task: SyncTask,
    dept: WPSDepartment,
    user: WPSMember,
    from: LocalMember,
  ) {
    log.debug({ info: `full sync ${task.taskId} diffDeptMember updateUser deptName: ${dept.name} deptId: ${dept.dept_id} userId: ${user.user_id}` })
    await engine.sm.exec(SyncStrategyType.UpdateDepartmentMember, {
      engine,
      task,
      dept,
      user,
      from
    })
  }

  async tryDeleteUser(
    engine: SyncEngine,
    task: SyncTask,
    root: WPSDepartment,
    taskId: string,
    dept: WPSDepartment,
    user: WPSMember,
    diffRootMember: boolean
  ) {
    log.i({ info: `full sync ${task.taskId} diffDeptMember removeUser deptName: ${dept.name} deptId: ${dept.dept_id} userId: ${user.user_id}` })
    const rd = await engine.was.root(dept.company_id)
    await engine.sm.exec(SyncStrategyType.DeleteDepartmentMember, {
      engine,
      task,
      root: rd,
      dept,
      user,
      diffRootMember: diffRootMember
    })
  }

  async tryAddUsers(engine: SyncEngine, task: SyncTask, dept: WPSDepartment, from: LocalDepartment, users: LocalMember[]) {
    if (!users || users.length <= 0) {
      return
    }
    fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
    let unionIds = users.map(u => u.uid)
    let wpsUsers = await engine.was.getUsersByLocal(
            dept.company_id,
            from.platform_id,
            unionIds,
          [WPSUserStatus.Active, WPSUserStatus.NotActive, WPSUserStatus.Disabled]
          )
    const tmps: Map<string, WPSUser> = new Map<string, WPSUser>()
    wpsUsers.forEach((x) => tmps.set(x.third_union_id, x))

    for (const user of users) {
      if (tmps.has(user.uid)) {
        let wu = tmps.get(user.uid)

        await engine.sm.exec(SyncStrategyType.JoinDepartmentMember, {
          engine,
          task,
          dept,
          wu,
          user,
        })
      }
    }

    // addUsers
    // await this.groupOpt(addUsers, async (items)=>{
    //   let deptUsers: WpsDeptAndLocalMember[] = []
    //   for (const item of items) {
    //     deptUsers.push({
    //       dept: dept,
    //       user: item
    //     } as WpsDeptAndLocalMember)
    //   }
    //   if (deptUsers.length > 0) {
    //     await engine.sm.exec(SyncStrategyType.AddDepartmentMembers, {
    //       engine,
    //       task,
    //       deptUsers: deptUsers
    //     })
    //   }
    // })
  }

  // 分批操作
  async groupOpt<T>(
      data: T[],
      func: { (objectGroup: T[]): Promise<void> },
      groupSize: number = config.asyncSize
  ) {
    const groupList = this.averageList(data, groupSize)
    for (const objectGroup of groupList) {
      await func(objectGroup)
    }
  }

  averageList<T>(list: T[], groupSize: number = config.asyncSize): T[][] {
    const groupList: T[][] = []
    let start = 0
    let end = 0

    while (start < list.length) {
      end = start + groupSize
      if (end > list.length) {
        end = list.length
      }

      const objectGroup = list.slice(start, end)
      groupList.push(objectGroup)
      start = end
    }
    return groupList
  }
}
