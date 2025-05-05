/* eslint-disable eqeqeq */
import {log, Ticker} from '../../cognac/common';
import {
  IBatchDeleteUserContext,
  IDiffUserTableContext,
  IDiffUserTableResult,
  IDiffUserTableStrategy, IUpdateUserContext,
  LocalMember,
  LocalUser,
  SyncEngine,
  SyncStrategyType,
  SyncTask,
  WPSDepartment,
  WPSDeptUser,
  WPSUser,
  WPSUserStatus
} from '../sync'
import fullSyncTaskService from '../../../modules/service/FullSyncTaskService'
import fullSyncRecordService from '../../../modules/service/FullSyncRecordService'
import delThresholdService from '../../../modules/service/FullSyncDelThresholdService'
import config from "../../../common/config";
import {CommonErrorName, StopTaskEntity, TaskStopError} from "../../../modules/sync/types";
import {FullSyncStatus, FullSyncUpdateType, RecordStatus} from "../../../modules/db/types";
import {FullSyncUserRecord} from "../../../modules/db/tables/FullSyncUserRecord";
import {FullSyncDeptRecord} from "../../../modules/db/tables/FullSyncDeptRecord";
import {FullSyncDeptUserRecord} from "../../../modules/db/tables/FullSyncDeptUserRecord";
import {FullSyncDelThreshold} from "../../../modules/db/tables/FullSyncDelThreshold";
import {IEnableUsersContext} from "../sync/engine/strategies/EnableUsersStrategy";
import {IDisableUsersContext} from "../sync/engine/strategies/DisableUsersStrategy";
import {CountDownLatch} from "../../../common/CountDownLatch";

export class DiffUserTableStrategy implements IDiffUserTableStrategy {
  name: string = SyncStrategyType.DiffUserTable

  async exec(ctx: IDiffUserTableContext): Promise<IDiffUserTableResult> {
    const { task, engine } = ctx

    log.i({
      info: `full sync ${task.taskId} diffUser companyId: ${task.cfg.thirdCompanyId} start`,
    })
    const tick = new Ticker()

    // 批处理
    const deleteUsers: WPSUser[] = []
    const updateUsers: { user: WPSUser; from: LocalUser }[] = []
    const localUserMap = new Map<string, LocalUser>()

    for (const platformId of task.cfg.platformIdList) {
      const localUsers = await engine.las.getAllUsersList(task.originTaskId, task.cfg.thirdCompanyId, platformId);
      log.i({
        info: `full sync ${task.taskId} diffUser getLocalUsers platformId: ${platformId}, localUserLength: ${
            localUsers.length
        } [${tick.end()}]`,
      })
      let wpsUsers = await engine.was.getAllUsers(
          task.cfg.companyId,
          platformId,
          [WPSUserStatus.Active, WPSUserStatus.NotActive, WPSUserStatus.Disabled],
      )
      log.i({
        info: `full sync ${task.taskId} diffUser getWpsAllUsers platformId: ${platformId}, wasUserLength: ${
            wpsUsers.length
        } [${tick.end()}]`,
      })

      if (!localUsers || localUsers.length <= 0) {
        log.i({ info: `full sync DiffUserTableStrategy: 采集表未查到用户数据，为避免删除所有用户，账号同步退出, taskId: ${task.taskId}, third_company_id: ${task.cfg.thirdCompanyId}` })
        throw new TaskStopError(task.taskId, CommonErrorName.TaskError, "采集表未查到用户数据，为避免删除所有用户，账号同步退出")
      }

      fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)

      localUsers.forEach((e) => {
        e.company_id = task.cfg.companyId
        localUserMap.set(e.uid, e)
      })

      // 过滤 非第三方用户
      wpsUsers = this.filter(wpsUsers)

      for (const wpsUser of wpsUsers) {
        if (!wpsUser.third_union_id) {
          continue
        }
        // need delete
        if (!localUserMap.has(wpsUser.third_union_id)) {
          deleteUsers.push(wpsUser)
          localUserMap.delete(wpsUser.third_union_id)
          continue
        }

        // need update
        const localUser = localUserMap.get(wpsUser.third_union_id)
        if (localUser) {
          updateUsers.push({
            user: wpsUser,
            from: localUser,
          })
          localUserMap.delete(wpsUser.third_union_id)
        }
      }
    }
    fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)

    // 对比部门和部门用户, 检查删除阈值
    if (!task.continueSync || task.againCheck) {
      await this.checkDelThreshold(engine, task, deleteUsers)
    }

    // batch delete
    await this.deleteUsers(deleteUsers, engine, task)
    await this.updateUsers(updateUsers, engine, task)
    await this.enableOrDisableUsers(updateUsers, engine, task)

    log.i({
      info: `full sync ${task.taskId} diffUser addUserLength: ${
        Array.from(localUserMap.values()).length
      } delUserLength: ${deleteUsers.length} updateUserLength: ${
        updateUsers.length
      } success[${tick.end()}]`,
    })
    return { code: 'ok' }
  }

  async checkDelThreshold(engine: SyncEngine, task: SyncTask, deleteUsers: WPSUser[]) {
    log.i({
      info: `full sync ${task.taskId} diffUser checkDelThreshold companyId: ${task.cfg.thirdCompanyId} start`,
    })
    const tick = new Ticker()

    let delConfig = await delThresholdService.getConfig(task.cfg.companyId)
    if (!delConfig) {
      delConfig = {user_del: config.threshold.userDel, dept_del: config.threshold.deptDel, dept_user_del: config.threshold.deptUserDel} as FullSyncDelThreshold
    }
    let diffData = await this.diffDeptAndUserDelete(engine, task)
    let deleteDepts: WPSDepartment[] = diffData.wpsDeptDelArr
    let deleteDeptUsers: WPSDeptUser[] = diffData.deptUserDelArr

    log.i({
      info: `full sync ${task.taskId} diffUser checkDelThreshold delUserLength: ${
        deleteUsers.length} delDeptLength: ${deleteDepts.length
      } delDeptUserLength: ${deleteDeptUsers.length} success[${tick.end()}]`,
    })

    if (deleteUsers.length >= delConfig.user_del
        || deleteDepts.length >= delConfig.dept_del
        || deleteDeptUsers.length >= delConfig.dept_user_del) {

      await fullSyncRecordService.addUserRecords(deleteUsers.map(x => {
        return {
          task_id: task.taskId,
          company_id: x.company_id,
          name: x.nick_name,
          account: x.login_name,
          platform_id: x.third_platform_id,
          uid: x.third_union_id,
          abs_path: "",
          update_type: FullSyncUpdateType.UserDel,
          status: RecordStatus.WARN,
          msg: "触发删除阈值告警"
        } as FullSyncUserRecord
      }))

      await fullSyncRecordService.addDeptRecords(deleteDepts.map(x => {
        return {
          task_id: task.taskId,
          company_id: x.company_id,
          name: x.name,
          platform_id: x.third_platform_id,
          did: x.third_dept_id,
          wps_did: x.dept_id,
          wps_pid: x.dept_pid,
          abs_path: x.abs_path,
          update_type: FullSyncUpdateType.DeptDel,
          status: RecordStatus.WARN,
          msg: "触发删除阈值告警"
        } as FullSyncDeptRecord
      }))

      await fullSyncRecordService.addDeptUserRecords(deleteDeptUsers.map(x => {
        return {
          task_id: task.taskId,
          company_id: x.company_id,
          name: x.nick_name,
          account: x.login_name,
          platform_id: x.third_platform_id,
          uid: x.third_union_id,
          wps_did: x.did,
          abs_path: x.abs_path,
          update_type: FullSyncUpdateType.UserDeptDel,
          status: RecordStatus.WARN,
          msg: "触发删除阈值告警"
        } as FullSyncDeptUserRecord
      }))
      task.status = task.status == FullSyncStatus.SYNC_SCOPE_WARN ? task.status : FullSyncStatus.SYNC_DEL_WARN
      task.msg = `${task.msg} 触发删除阈值限制，请确认！本次同步用户删除: ${deleteUsers.length}, 部门删除: ${
        deleteDepts.length}, 部门用户关系删除: ${deleteDeptUsers.length
      }, 删除阈值配置: 用户删除 ${delConfig.user_del}, 部门删除 ${delConfig.dept_del}, 部门用户关系删除 ${delConfig.dept_user_del}`

      throw new TaskStopError(task.taskId, CommonErrorName.TaskDeleteThreshold, task.msg)
    }
    if (task.status == FullSyncStatus.SYNC_SCOPE_WARN) {
      throw new TaskStopError(task.taskId, CommonErrorName.TaskScopeAbsence, task.msg)
    }
  }

  async diffDeptAndUserDelete(engine: SyncEngine, task: SyncTask) {
    let localDepts = []
    // 1.先读取本地所有部门数据
    if (task.cfg.platformIdList.length > 1) {
      for (const platId of task.cfg.platformIdList) {
        let minDeptId = await engine.las.getDeptMinOrMaxId(task.originTaskId, task.cfg.thirdCompanyId, platId, 'ASC')
        let maxDeptId = await engine.las.getDeptMinOrMaxId(task.originTaskId, task.cfg.thirdCompanyId, platId, 'DESC')
        let lds = await engine.las.pageQueryDepts(task.originTaskId, task.cfg.thirdCompanyId, platId, minDeptId, maxDeptId)
        for (const ld of lds) {
          localDepts.push(ld)
        }
      }
    } else {
      let minDeptId = await engine.las.getDeptMinOrMaxId(task.originTaskId, task.cfg.thirdCompanyId, task.cfg.platformIdList[0], 'ASC')
      let maxDeptId = await engine.las.getDeptMinOrMaxId(task.originTaskId, task.cfg.thirdCompanyId, task.cfg.platformIdList[0], 'DESC')
      localDepts = await engine.las.pageQueryDepts(task.originTaskId, task.cfg.thirdCompanyId, task.cfg.platformIdList[0], minDeptId, maxDeptId)
    }
    log.i({
      info: `full sync ${task.taskId} diffUser diffDeptAndUserDelete listAllDepartments end companyId: ${task.cfg.thirdCompanyId}, localDeptsLength: ${localDepts.length}`,
    })
    let lasDeptSet = new Set<string>()
    localDepts.forEach(x => lasDeptSet.add(`${x.did}${config.splitSymbol}${x.platform_id}`))

    const diffData = await this.diffWpsDeptAndUserDelete(engine, task)
    log.i({
      info: `full sync ${task.taskId} diffUser diffDeptAndUserDelete wasListAllDepartments end companyId: ${task.cfg.thirdCompanyId}`,
    })
    fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)

    let wpsDeptDelArr = []
    for (const wpsDept of diffData.wpsDepts) {
      if (!wpsDept.third_dept_id) {
        continue
      }
      if (!lasDeptSet.has(`${wpsDept.third_dept_id}${config.splitSymbol}${wpsDept.third_platform_id}`)) {
        wpsDeptDelArr.push(wpsDept)
      }
    }
    return {
      wpsDeptDelArr,
      deptUserDelArr: diffData.deptUserDelArr
    }
  }

  async diffWpsDeptAndUserDelete(engine: SyncEngine, task: SyncTask) {
    const wpsRootDept = await engine.was.root(task.cfg.companyId)
    let rootUsers = await engine.was.listUsersByDepartment(task.cfg.companyId, wpsRootDept)
    // 对比根部门的用户
    let rootDelUsers = await this.diffDeptUsers(engine, task, wpsRootDept, wpsRootDept, rootUsers)
    const childs = await engine.was.listDepartments(task.cfg.companyId, wpsRootDept)
    let wpsDepts: WPSDepartment[] = []
    let deptUserDelArr: WPSDeptUser[] = [...rootDelUsers]
    // 一级部门异步并发对比
    await this.groupOpt(childs, async (items)=>{
      let latch = new CountDownLatch(items.length)
      for (const item of items) {
        if (!item.third_dept_id) {
          latch.countDown()
          continue
        }
        wpsDepts.push(item)
        this.diffWpsFirstDept(engine, task, item, wpsDepts, deptUserDelArr).then(() => {
          latch.countDown()
          log.i({
            info: `full sync ${task.taskId} diffUser diffWpsDeptAndUserDelete diffWpsFirstDept end companyId: ${task.cfg.thirdCompanyId}, firstDeptDid: ${item.third_dept_id}, firstDeptLength: ${childs.length}`,
          })
        }).catch((err) => {
          latch.countDown()
          log.e({info: `full sync ${task.taskId} diffUser diffWpsDeptAndUserDelete diffWpsFirstDept throw error: ${err}, firstDeptDid: ${item.third_dept_id}`})
          // 中断任务
          fullSyncTaskService.stopTask({
            taskId: task.taskId,
            companyId: task.cfg.companyId,
            name: CommonErrorName.TaskCancel,
            msg: `diffWpsDeptAndUserDelete diffWpsFirstDept throw error: ${err.message?.substring(0,1000)}`,
          } as StopTaskEntity)
        })
      }
      await latch.await()
    }, config.asyncSize)
    return {wpsDepts, deptUserDelArr}
  }

  async diffWpsFirstDept(engine: SyncEngine, task: SyncTask, root: WPSDepartment, wpsDepts: WPSDepartment[], deptUserDelArr: WPSDeptUser[]) {
    const stack = [root]
    while (stack.length > 0) {
      const dept = stack.pop()
      if (!dept) continue
      // 此处同时获取云文档部门用户关系
      const users = await engine.was.listUsersByDepartment(task.cfg.companyId, dept)
      let delArr = await this.diffDeptUsers(engine, task, null, dept, users)
      deptUserDelArr.push(...delArr)

      const childs = await engine.was.listDepartments(task.cfg.companyId, dept)
      for (const d of childs) {
        if (!d.third_dept_id) {
          continue
        }
        wpsDepts.push(d)
        stack.push(d)
      }
      if (wpsDepts.length % 10000 == 0) {
        log.i({
          info: `full sync ${task.taskId} diffUser diffDeptAndUserDelete wasListAllDepartments wpsDepts.length: ${wpsDepts.length}`,
        })
      }
    }
  }

  async diffDeptUsers(engine: SyncEngine, task: SyncTask, root: WPSDepartment, dept: WPSDepartment, wasDeptUsers: WPSUser[]) {
    let lasUsers
    if (root && root.dept_id == dept.dept_id) {
      let lroot = await engine.las.root(task.originTaskId, task.cfg.thirdCompanyId)
      lasUsers = await engine.las.listDeptUsers(task.originTaskId, task.cfg.thirdCompanyId, lroot.platform_id, lroot.did)
    } else {
      lasUsers = await engine.las.listDeptUsers(task.originTaskId, task.cfg.thirdCompanyId, dept.third_platform_id, dept.third_dept_id)
    }
    let tempMap = new Map<string, LocalMember>()
    let delUsers: WPSDeptUser[] = []
    lasUsers.forEach(x => tempMap.set(x.uid, x))

    for (const wasDeptUser of wasDeptUsers) {
      if (!wasDeptUser.third_union_id) {
        continue
      }
      if (!tempMap.has(wasDeptUser.third_union_id)) {
        wasDeptUser.abs_path = dept.abs_path
        let deptUser = wasDeptUser as WPSDeptUser
        deptUser.did = dept.third_dept_id
        delUsers.push(deptUser)
      }
    }
    return delUsers
  }

  async deleteUsers(users: WPSUser[], engine: SyncEngine, task: SyncTask) {
    log.i({ info: `full sync ${task.taskId} deleteUsers start. deleteUsersLength: ${users.length}`})
    await this.groupOpt(users, async (items)=>{
      const ctx: IBatchDeleteUserContext = {
        engine,
        users: items,
        task
      }
      await engine.sm.exec(SyncStrategyType.BatchDeleteUser, ctx)
    })
    log.i({ info: `full sync ${task.taskId} deleteUsers end.`})
  }

  async updateUsers(
    mapArray: { user: WPSUser; from: LocalUser }[],
    engine: SyncEngine,
    task: SyncTask
  ) {
    log.i({ info: `full sync ${task.taskId} updateUser start. usersLength: ${mapArray.length}`})
    for (const element of mapArray) {
      const ctx: IUpdateUserContext = {
        engine,
        task,
        from: element.from,
        user: element.user
      }
      await engine.sm.exec(SyncStrategyType.UpdateUser, ctx)
    }
    log.i({ info: `full sync ${task.taskId} updateUser end. `})
  }

  async enableOrDisableUsers(
      mapArray: { user: WPSUser; from: LocalUser }[],
      engine: SyncEngine,
      task: SyncTask
  ) {
    let enableArray: WPSUser[] = []
    let disableArray: WPSUser[] = []
    for (const element of mapArray) {
      if (element.user.status === WPSUserStatus.Disabled && element.from.employment_status != WPSUserStatus.Disabled) {
        enableArray.push(element.user)
      }
      if (element.user.status != WPSUserStatus.Disabled && element.from.employment_status === WPSUserStatus.Disabled) {
        disableArray.push(element.user)
      }
    }
    log.i({ info: `full sync ${task.taskId} enableUsers start. usersLength: ${enableArray.length}`})
    await this.groupOpt(enableArray, async (items)=>{
      const ctx: IEnableUsersContext = {
        engine,
        task,
        users: items
      }
      await engine.sm.exec(SyncStrategyType.EnableUsers, ctx)
    })
    log.i({ info: `full sync ${task.taskId} enableUsers end. `})

    log.i({ info: `full sync ${task.taskId} disableUsers start. usersLength: ${disableArray.length}`})
    await this.groupOpt(disableArray, async (items)=>{
      const ctx: IDisableUsersContext = {
        engine,
        task,
        users: items,
        msg: ""
      }
      await engine.sm.exec(SyncStrategyType.DisableUsers, ctx)
    })
    log.i({ info: `full sync ${task.taskId} disableUsers end`})
  }

  filter(wpsUsers: WPSUser[]): WPSUser[] {
    return wpsUsers.filter((wpsUser) => wpsUser.third_union_id)
  }

  // 分批操作
  async groupOpt<T>(
      data: T[],
      func: { (objectGroup: T[]): Promise<void> },
      groupSize: number = config.groupSize
  ) {
    const groupList = this.averageList(data, groupSize)
    for (const objectGroup of groupList) {
      await func(objectGroup)
    }
  }

  averageList<T>(list: T[], groupSize: number = config.groupSize): T[][] {
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
