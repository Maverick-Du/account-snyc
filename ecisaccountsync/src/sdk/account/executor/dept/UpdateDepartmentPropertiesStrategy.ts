import {log, Ticker} from '../../../cognac/common';
import {
  IUpdateDepartmentPropertiesContext,
  IUpdateDepartmentPropertiesResult,
  IUpdateDepartmentPropertiesStrategy,
  SyncStrategyType, DEFAULT_ROOT_DEPT_P_ID, WPSDepartment, SyncEngine, SyncTask, LocalDepartment
} from '../../sync'
import {WpsApiErrorCode} from "../../../../modules/sync/types";
import config from "../../../../common/config";
import {IncrementSyncDeptNameConflict} from "../../../../modules/increment_sync/types";
import {md5} from "../../../../common/util";

export class UpdateDepartmentPropertiesStrategy implements IUpdateDepartmentPropertiesStrategy {
  name: string = SyncStrategyType.UpdateDepartmentProperties

  async exec(ctx: IUpdateDepartmentPropertiesContext): Promise<IUpdateDepartmentPropertiesResult> {
    const { engine, dept, from, task } = ctx
    log.debug({ info: `full sync ${task.taskId} updateDeptProperties deptName: ${dept.name} deptId: ${dept.dept_id} fromName: ${from.name} fromId: ${from.did} start` })
    const tick = new Ticker()
    // 1. 如果是根目录，不需要同步。
    const root = await engine.was.root(dept.company_id)

    if (dept.dept_id === root.dept_id || from.pid === DEFAULT_ROOT_DEPT_P_ID) {
      log.i({ info: `full sync ${task.taskId} updateDeptProperties deptName: ${dept.name} deptId: ${dept.dept_id} fromName: ${from.name} fromId: ${from.did} success[${tick.end()}]` })
      return { code: 'ignore', dept: null }
    }

    // 2. 如果名字不同
    let order: number = Number.isInteger(from.order) ? from.order : dept.order
    if (dept.name !== from.name || order !== dept.order) {
      try {
        // 判断同级子孩子是否有同名的部门
        await engine.was.updateDepartment(dept.company_id, dept, null, from.name, order)
        log.i({ info: `full sync ${task.taskId} updateDeptProperties deptName: ${dept.name} deptId: ${dept.dept_id} fromName: ${from.name} fromId: ${from.did} success[${tick.end()}]` })
      } catch (err) {
        await this.handleDeptNameExists(engine, task, dept, from, order, err)
      }
      let newDept = await engine.was.getDepartmentById(dept.company_id, dept.dept_id)
      return { code: 'ok', dept: newDept }
    }
    return { code: 'ignore', dept: null }
  }

  async handleDeptNameExists(engine: SyncEngine, task: SyncTask, dept: WPSDepartment, from: LocalDepartment, order: number, err: any) {
    let resCode = err.response?.data?.code
    if (resCode == WpsApiErrorCode.DeptNameExists &&
        config.strategy.dept_name_conflict == IncrementSyncDeptNameConflict.RENAME
    ) {
      let suffix: string
      if (from.did.length > 16) {
        let md5Str = md5(from.did)
        suffix = `_${md5Str}`
      } else {
        suffix = `_${from.did}`
      }
      let name = `${from.name}${suffix}`
      if (name.length > 255) {
        name = `${from.name.substring(0, 255 - suffix.length)}${suffix}`
      }
      await engine.was.updateDepartment(dept.company_id, dept, null, name, order)
      log.i({ info: `full sync ${task.taskId} updateDeptProperties handleDeptNameExists deptName: ${name}, deptId: ${dept.dept_id} success` })
    } else {
      throw err
    }
  }
}
