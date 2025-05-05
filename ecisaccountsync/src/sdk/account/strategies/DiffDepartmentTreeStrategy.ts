import {log, Ticker} from '../../cognac/common';
import {
  IDiffDepartmentTreeContext,
  IDiffDepartmentTreeResult,
  IDiffDepartmentTreeStrategy,
  SyncEngine,
  SyncMap,
  SyncTask,
  LocalDepartment,
  WPSDepartment,
  SyncStrategyType,
  DiffDepartmentTreeAction,
  DeleteDepartmentTreeAction,
  AddDepartmentTreeAction, DEFAULT_ROOT_DEPT_P_ID, IDiffDepartmentMembersContext
} from '../sync'
import fullSyncTaskService from '../../../modules/service/FullSyncTaskService'
import {CommonErrorName, TaskStopError} from "../../../modules/sync/types";

export class DiffDepartmentTreeStrategy implements IDiffDepartmentTreeStrategy {
  name: string = SyncStrategyType.DiffDepartmentTree

  async exec(ctx: IDiffDepartmentTreeContext): Promise<IDiffDepartmentTreeResult> {
    const { task, src, dist, engine } = ctx
    log.debug({ info: `full sync ${task.taskId} diffDept srcName: ${src.name} srcId: ${src.did}, distName: ${dist.name} distId: ${dist.dept_id} start` })
    fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
    const tick = new Ticker()
    // 1. 更新属性信息
    await this.updateDepartment(engine, task, src, dist)

    // 2. 更新子目录
    await this.syncChildren(engine, task, src, dist)
    // 对比一级部门时，记录日志，方便查看对比进度
    if (src.pid == task.rootDid) {
      log.i({ info: `full sync ${task.taskId} diffDept srcName: ${src.name} srcId: ${src.did}, distName: ${dist.name} distId: ${dist.dept_id} success[${tick.end()}]` })
    }

    return { code: 'ok' }
  }

  // 更新部门成员关系
  async updateDepartment(
    engine: SyncEngine,
    task: SyncTask,
    src: LocalDepartment,
    dist: WPSDepartment
  ) {
    const ctx: IDiffDepartmentMembersContext = {
      engine,
      dept: dist,
      from: src,
      task,
      diffRootMember: false
    }
    await engine.sm.exec(SyncStrategyType.DiffDepartmentMembers, ctx)
  }

  async syncChildren(
    engine: SyncEngine,
    task: SyncTask,
    src: LocalDepartment,
    dist: WPSDepartment
  ) {
    const tempAddArr = []
    const tempDelArr = []
    const tempDiffArr = []

    const dDepts = await engine.was.listDepartments(task.cfg.companyId, dist)
    for (const platformId of task.cfg.platformIdList) {
      const sDepts = await engine.las.listDepartments(task.originTaskId, task.cfg.thirdCompanyId, platformId, src.did)
      log.debug({ info: `full sync ${task.taskId} diffDept syncChildren srcName: ${src.name} srcId: ${src.did}, lasDeptSize: ${sDepts.length}, wasDeptSize: ${dDepts.length}` })

      if (src.pid === DEFAULT_ROOT_DEPT_P_ID && sDepts.length <= 0) {
        log.i({ info: `full sync ${task.taskId} diffDept exit, 采集表未查到部门数据，为避免删除所有部门，账号同步退出, taskId: ${task.taskId}, third_company_id: ${task.cfg.thirdCompanyId}` })
        throw new TaskStopError(task.taskId, CommonErrorName.TaskError, "采集表未查到部门数据，为避免删除所有部门，账号同步退出")
      }
      const tmps: SyncMap<LocalDepartment> = {}
      sDepts.forEach(x => (tmps[x.did] = x))

      for (const dd of dDepts) {
        // 去掉其他数据源同步的数据
        if (dd.third_platform_id !== platformId) {
          continue
        }
        const sd = tmps[dd.third_dept_id]
        if (sd) {
          delete tmps[dd.third_dept_id]
          tempDiffArr.push(new DiffDepartmentTreeAction(sd, dd))
        } else {
          tempDelArr.push(new DeleteDepartmentTreeAction(dd))
        }
      }

      for (const add of Object.values(tmps)) {
        tempAddArr.push(new AddDepartmentTreeAction(dist, add))
      }
    }

    // for (const add of tempAddArr) {
    //   task.push(add)
    // }
    log.debug({ info: `full sync ${task.taskId} diffDept AddDepartmentTreeAction Length: ${tempAddArr.length}` })

    for (const diff of tempDiffArr) {
      task.push(diff)
    }
    log.debug({ info: `full sync ${task.taskId} diffDept DiffDepartmentTreeAction Length: ${tempDiffArr.length}` })

    // for (const del of tempDelArr) {
    //   task.push(del)
    // }
    log.debug({ info: `full sync ${task.taskId} diffDept DeleteDepartmentTreeAction Length: ${tempDelArr.length}` })
  }
}
