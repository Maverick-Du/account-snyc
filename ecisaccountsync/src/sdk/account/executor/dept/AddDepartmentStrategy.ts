import {
  IAddDepartmentContext,
  IAddDepartmentResult,
  IAddDepartmentStrategy, LocalDepartment,
  SyncStrategyType, WPSDepartment
} from '../../sync'
import {WpsApiErrorCode} from "../../../../modules/sync/types";
import config from "../../../../common/config";
import {IncrementSyncDeptNameConflict} from "../../../../modules/increment_sync/types";
import {md5} from "../../../../common/util";
import sync from "../../../../modules/sync";
import {log, Ticker} from '../../../cognac/common';

/**
 * 处理添加单个部门操作
 */
export class AddDepartmentStrategy implements IAddDepartmentStrategy {
  name: string = SyncStrategyType.AddDepartment

  async exec(ctx: IAddDepartmentContext): Promise<IAddDepartmentResult> {
    const { engine, parent, dept, task } = ctx
    log.debug({ info: `full sync ${task.taskId} addDept parent: ${parent.dept_id}, thirdDeptId: ${dept.did}, deptName: ${dept.name} start` })
    const tick = new Ticker()
    // add
    let wpsDepartment
    try {
      wpsDepartment = await engine.was.addDepartment(parent.company_id, parent.dept_id, dept.platform_id, dept.did, dept.name, dept.order || 0, dept.source, dept.type)
      log.i({ info: `full sync ${task.taskId} addDept deptName: ${dept.name}, deptId: ${dept.did} success[${tick.end()}]` })
      return { code: 'ok', dept: wpsDepartment }
    } catch (err) {
      return this.handleDeptNameExists(err, dept, parent)
    }
  }

  async handleDeptNameExists(err: any, dept: LocalDepartment, parent: WPSDepartment): Promise<IAddDepartmentResult> {
    let resCode = err.response?.data?.code
    if (resCode == WpsApiErrorCode.DeptNameExists &&
        config.strategy.dept_name_conflict == IncrementSyncDeptNameConflict.RENAME
    ) {
      let suffix: string
      if (dept.did.length > 16) {
        let md5Str = md5(dept.did)
        suffix = `_${md5Str}`
      } else {
        suffix = `_${dept.did}`
      }
      let name = `${dept.name}${suffix}`
      if (name.length > 255) {
        name = `${dept.name.substring(0, 255 - suffix.length)}${suffix}`
      }
      let wpsDept = await sync.ctx.engine.was.addDepartment(parent.company_id, parent.dept_id, dept.platform_id, dept.did, name,  dept.order || 0, dept.source, dept.type)
      log.i({ info: `full sync ${dept.task_id} addDept handleDeptNameExists deptName: ${name}, deptId: ${dept.did} success` })
      return { code: 'ok', dept: wpsDept }
    } else {
      throw err
    }
  }
}


