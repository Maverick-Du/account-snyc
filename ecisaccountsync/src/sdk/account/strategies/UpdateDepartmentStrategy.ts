import {log, Ticker} from '../../cognac/common';
import {
  SyncStrategyType,
  IUpdateDepartmentContext,
  IUpdateDepartmentResult,
  IUpdateDepartmentStrategy,
  SyncEngine,
  WPSDepartment,
  LocalDepartment,
  IUpdateDepartmentPropertiesContext,
  SyncTask, IDiffDepartmentMembersContext
} from '../sync'
import fullSyncTaskService from "../../../modules/service/FullSyncTaskService";

export class UpdateDepartmentStrategy implements IUpdateDepartmentStrategy {
  name: string = SyncStrategyType.UpdateDepartment

  async exec(ctx: IUpdateDepartmentContext): Promise<IUpdateDepartmentResult> {
    const { engine, dept, from, task } = ctx
    log.debug({ info: `v1.UpdateDepartmentStrategy deptName: ${dept.name} deptId: ${dept.dept_id} fromName: ${from.name} fromId: ${from.did} start` })
    fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
    const tick = new Ticker()
    // 1. 更新属性信息
    await this.updateProperties(engine, dept, from, task)
    log.debug({ info: `v1.UpdateDepartmentStrategy.updateProperties deptName: ${dept.name} deptId: ${dept.dept_id} fromName: ${from.name} fromId: ${from.did} success[${tick.end()}]` })

    // 2. 跟新成员信息
    await this.updateMembers(engine, dept, from, task)
    log.debug({ info: `v1.UpdateDepartmentStrategy deptName: ${dept.name} deptId: ${dept.dept_id} fromName: ${from.name} fromId: ${from.did} success[${tick.end()}]` })

    return { code: 'ok' }
  }

  async updateProperties(engine:SyncEngine, dept:WPSDepartment, from:LocalDepartment, task: SyncTask) {
    const ctx: IUpdateDepartmentPropertiesContext = {
      engine, dept, from, task
    }
    await engine.sm.exec(SyncStrategyType.UpdateDepartmentProperties, ctx)
  }

  async updateMembers(engine:SyncEngine, dept:WPSDepartment, from:LocalDepartment, task: SyncTask) {
    const ctx: IDiffDepartmentMembersContext = {
      engine,
      dept,
      from,
      task,
      diffRootMember: false
    }
    await engine.sm.exec(SyncStrategyType.DiffDepartmentMembers, ctx)
  }
}
