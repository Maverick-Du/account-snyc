/* eslint-disable eqeqeq */
import {log, Ticker} from '../../cognac/common';
import {
  CompanyCfg,
  IHandleLasDataCheckTypeContext,
  IHandleLasDataCheckTypeResult,
  IHandleLasDataCheckTypeStrategy,
  LocalDepartment,
  SyncEngine,
  SyncStrategyType,
  SyncTask,
} from '../sync'
import fullSyncScopeService from "../../../modules/service/FullSyncScopeService";
import fullSyncRecordService from "../../../modules/service/FullSyncRecordService";
import {FullSyncScopeSchema} from "../../../modules/db/tables/FullSyncScope";
import config from "../../../common/config";
import sync from "../../../modules/sync";
import {FullSyncStatus, ScopeCheckType} from "../../../modules/db/types";
import {LockKey} from "../../../modules/lock/LockService";
import {lockService} from "../../../modules/lock";
import fullSyncTaskService from "../../../modules/service/FullSyncTaskService";
import {FullSyncTaskStatisticsSchema} from "../../../modules/db/tables/FullSyncTaskStatistics";

export class HandleLasDataCheckTypeStrategy implements IHandleLasDataCheckTypeStrategy {
  name: string = SyncStrategyType.HandleLasCheckType

  async exec(ctx: IHandleLasDataCheckTypeContext): Promise<IHandleLasDataCheckTypeResult> {
    const { task, engine } = ctx

    log.i({
      info: `full sync ${task.taskId} handleLasCheckType companyId: ${task.cfg.thirdCompanyId} start`
    })
    const tick = new Ticker()

    let root = await engine.las.root(task.originTaskId, task.cfg.thirdCompanyId)

    // 查询同步范围配置
    let checkDeptData = await this.getAllCheckDepts(task.cfg)
    log.i({
      info: `full sync ${task.taskId} handleLasCheckType companyId: ${task.cfg.thirdCompanyId} checkDepts: ${
        checkDeptData.checkDepts.map(item => `${item.platform_id}&${item.did}&${item.check_type}`).join(',')}, scopeVersion: ${checkDeptData.scopeVersion?.scope_version}`
    })
    // 继续同步，同步范围版本发生变更时需要重新检查删除阈值
    if (!task.continueSync) {
      task.scopeVersion = checkDeptData.scopeVersion.scope_version
    } else if (checkDeptData.scopeVersion.scope_version != task.scopeVersion) {
      task.scopeVersion = checkDeptData.scopeVersion.scope_version
      task.againCheck = true
      log.i({
        info: `full sync ${task.taskId} handleLasCheckType companyId: ${task.cfg.thirdCompanyId} scope_version change, 需要重新检查`
      })
    }

    // 根据勾选范围，查询所有勾选范围的父部门和删除的勾选部门
    let data = await this.getCheckDeptParents(task.originTaskId, task.cfg.thirdCompanyId, root, checkDeptData.checkDepts)
    // 勾选范围发生变更告警
    // 首次同步，有勾选部门被删除 或 继续同步，同步范围版本发生变更
    if ((!task.continueSync && data.deleteScopes.length > 0) || (task.continueSync && task.againCheck)) {
      data.deleteScopes.forEach(x => fullSyncRecordService.addDeptScopeRecord(task.taskId, x))
      task.status = FullSyncStatus.SYNC_SCOPE_WARN
      task.msg = `组织架构范围变更，请重新确认同步范围.`
      if (data.deleteScopes.length > 0) {
        task.msg = `${task.msg} 缺少${data.deleteScopes[0].name}(${data.deleteScopes[0].did})等${data.deleteScopes.length}个部门.`
      }
      log.i({
        info: `full sync ${task.taskId} handleLasCheckType companyId: ${task.cfg.thirdCompanyId} 触发组织架构范围变更警告`
      })
    }

    // 未勾选或全勾选情况处理
    let rootCheck = data.pidMap.get(`${root.did}${config.splitSymbol}${root.platform_id}`)
    if (checkDeptData.checkDepts.length > 0 && rootCheck != ScopeCheckType.ALL) {
      // 2. 重置las表check_type
      await engine.las.resetCheckType(task.originTaskId, task.cfg.thirdCompanyId, task.cfg.platformIdList, false)

      // 将虚拟根部门设置为勾选
      await engine.las.checkDept(root.task_id, root.third_company_id, root.platform_id, root.did)

      // 3. 重新根据勾选范围处理las表数据
      for (const platId of task.cfg.platformIdList) {
        let childs = await engine.las.listDepartmentsNoCheck(root.task_id, root.third_company_id, platId, root.did)
        for (const child of childs) {
          await this.handleLasData(engine, task.cfg, child, data.pidMap)
        }
      }
      log.i({
        info: `full sync ${task.taskId} handleLasCheckType companyId: ${task.cfg.thirdCompanyId} handle las data check_type end`
      })
    } else {
      // 2. 全选重置las表check_type
      await engine.las.resetCheckType(task.originTaskId, task.cfg.thirdCompanyId, task.cfg.platformIdList, true)

      // for (const platId of task.cfg.platformIdList) {
      //   let childs = await engine.las.listDepartmentsNoCheck(root.task_id, root.third_company_id, platId, root.did)
      //   for (const child of childs) {
      //     log.i({
      //       info: `full sync ${task.taskId} handleLasCheckType start check dept: ${child.name} companyId: ${task.cfg.thirdCompanyId}`
      //     })
      //     await this.checkAllDeptAndUsers(engine, task.cfg, child)
      //   }
      // }
    }
    log.i({
      info: `full sync ${task.taskId} resetCheckType success companyId: ${task.cfg.thirdCompanyId}`
    })
    // 不在任何部门下的用户
    // for (const platId of task.cfg.platformIdList) {
    //   let noUids = await engine.las.getNoDeptUids(root.task_id, root.third_company_id, platId)
    //   if (noUids.length > 0) {
    //     await engine.las.cancelUserCheck(root.task_id, root.third_company_id, platId, noUids)
    //   }
    //   log.i({
    //     info: `full sync ${task.taskId} handleLasCheckType companyId: ${task.cfg.thirdCompanyId} platformId: ${platId}, cancel NoDeptUser Uids: ${noUids.join(',')}`
    //   })
    // }

    // 4. 统计部门、用户数据
    await this.countTaskLasData(engine, task)

    log.i({
      info: `full sync ${task.taskId} handleLasCheckType companyId: ${task.cfg.thirdCompanyId} end. success[${tick.end()}]`,
    })

    return { code: 'ok' }
  }

  async countTaskLasData(engine: SyncEngine, task: SyncTask) {
    let data = await engine.las.statisticsLasData(task.originTaskId, task.cfg.thirdCompanyId)
    if (data.scope_user <= 0 || data.scope_dept <= 0 || data.scope_dept_user <= 0) {
      log.i({
        info: `full sync ${task.taskId} countTaskLasData scope_user or scope_dept or scope_dept_user size <= 0 companyId: ${task.cfg.thirdCompanyId}`,
      })
      throw new Error("full sync ${task.taskId} countTaskLasData scope_user or scope_dept or scope_dept_user size <= 0")
    }
    data.task_id = task.taskId
    data.company_id = task.cfg.companyId
    let statistics = await fullSyncTaskService.getFullSyncStatisticData(task.taskId, task.cfg.companyId)
    if (statistics) {
      await fullSyncTaskService.updateStatistics(data as FullSyncTaskStatisticsSchema)
    } else {
      await fullSyncTaskService.saveStatistics(data as FullSyncTaskStatisticsSchema)
    }
  }

  async getAllCheckDepts(cfg: CompanyCfg) {
    let lockId = 0
    let lockKey = `${LockKey.UPDATE_SYNC_SCOPE}_${cfg.companyId}`
    try {
      lockId = await lockService.tryLock(lockKey, `${lockKey}_query_check_list`)
      if (lockId <= 0) {
        throw new Error(`同步范围修改中，请稍后再同步`)
      }
      return await fullSyncScopeService.getAllCheckDepts(cfg.companyId)
    } finally {
      if (lockId > 0) {
        await lockService.releaseLock(lockId, lockKey)
      }
    }
  }

  async handleLasData(engine: SyncEngine, cfg: CompanyCfg, dept: LocalDepartment, pidMap: Map<string, ScopeCheckType>) {
    let check = pidMap.get(`${dept.did}${config.splitSymbol}${dept.platform_id}`)
    if (check) {
      if (check == ScopeCheckType.PATH) {
        // 勾选当前部门
        await engine.las.checkDept(dept.task_id, dept.third_company_id, dept.platform_id, dept.did)

        // 继续处理当前部门子部门
        let cds = await engine.las.listDepartmentsNoCheck(dept.task_id, dept.third_company_id, dept.platform_id, dept.did)
        for (const child of cds) {
          await this.handleLasData(engine, cfg, child, pidMap)
        }
      } else if (check == ScopeCheckType.SELF) {
        // 勾选当前部门和用户
        await engine.las.checkDept(dept.task_id, dept.third_company_id, dept.platform_id, dept.did)
        let uids = await engine.las.getDeptUids(dept.task_id, dept.third_company_id, dept.platform_id, dept.did)
        if (uids.length > 0) {
          await engine.las.checkUsers(dept.task_id, dept.third_company_id, dept.platform_id, uids)
        }
        await engine.las.checkDeptUser(dept.task_id, dept.third_company_id, dept.platform_id, dept.did)

        // 继续处理当前部门子部门
        let cds = await engine.las.listDepartmentsNoCheck(dept.task_id, dept.third_company_id, dept.platform_id, dept.did)
        for (const child of cds) {
          await this.handleLasData(engine, cfg, child, pidMap)
        }
      } else {
        await this.checkAllDeptAndUsers(engine, cfg, dept)
      }
    }
  }

  async checkAllDeptAndUsers(engine: SyncEngine, cfg: CompanyCfg, dept: LocalDepartment) {
    const stack = [dept]
    while (stack.length > 0) {
      const d = stack.pop()
      if (!d) continue

      // 勾选当前部门和用户
      await engine.las.checkDept(d.task_id, d.third_company_id, d.platform_id, d.did)
      let uids = await engine.las.getDeptUids(d.task_id, d.third_company_id, d.platform_id, d.did)
      if (uids.length > 0) {
        await engine.las.checkUsers(d.task_id, d.third_company_id, d.platform_id, uids)
      }
      await engine.las.checkDeptUser(d.task_id, d.third_company_id, d.platform_id, d.did)

      // 继续勾选子部门
      let cds = await engine.las.listDepartmentsNoCheck(d.task_id, d.third_company_id, d.platform_id, d.did)
      for (const child of cds) {
        stack.push(child)
      }
    }
  }

  async getCheckDeptParents(taskId: string, thirdCompanyId: string, root: LocalDepartment, checkDepts: FullSyncScopeSchema[]) {
    let didsMap = new Map<string, string[]>()
    let pidMap = new Map<string, ScopeCheckType>()
    let checkMap = new Map<string, FullSyncScopeSchema>()
    checkDepts.forEach(x => {
      let dids = didsMap.get(x.platform_id)
      if (dids) {
        dids.push(x.did)
      } else {
        dids = []
        didsMap.set(x.platform_id, dids)
        dids.push(x.did)
      }
      checkMap.set(`${x.did}${config.splitSymbol}${x.platform_id}`, x)
    })
    for (const entry of didsMap.entries()) {
      let platformId = entry[0]
      let dids = entry[1]
      // 查las表并确认勾选的部门是否都存在
      let lasDepts = await sync.ctx.engine.las.getDepartmentsNoCheck(taskId, thirdCompanyId, platformId, dids)
      for (let lasDept of lasDepts) {
        checkMap.delete(`${lasDept.did}${config.splitSymbol}${lasDept.platform_id}`)
        let ld = lasDept
        // 向上记录父路径
        while (ld.pid != root.did) {
          let check = pidMap.get(`${ld.pid}${config.splitSymbol}${ld.platform_id}`)
          if (check) {
            break
          }
          pidMap.set(`${ld.pid}${config.splitSymbol}${ld.platform_id}`, ScopeCheckType.PATH)
          ld = await sync.ctx.engine.las.getDepartmentNoCheck(taskId, thirdCompanyId, platformId, ld.pid)
          if (!ld) {
            break
          }
        }
      }
    }
    // 记录勾选状态
    for (const checkDept of checkDepts) {
      pidMap.set(`${checkDept.did}${config.splitSymbol}${checkDept.platform_id}`, checkDept.check_type)
    }

    let deleteScopes = []
    for (const c of checkMap.values()) {
      deleteScopes.push(c)
    }
    return {
      pidMap,
      deleteScopes
    }
  }
}
