import {log, Ticker} from '../../../cognac/common';
import {
  IMoveDepartmentContext,
  IMoveDepartmentResult,
  IMoveDepartmentStrategy,
  SyncStrategyType, SyncTask, WPSDepartment
} from '../../sync'
import {WpsApiErrorCode} from "../../../../modules/sync/types";
import config from "../../../../common/config";
import {IncrementSyncDeptNameConflict} from "../../../../modules/increment_sync/types";
import {md5} from "../../../../common/util";
import sync from "../../../../modules/sync";

/**
 * 执行移动部门
 * 需要考虑移动后，新部门名字重复：本策略不考虑部门重复
 */
export class MoveDepartmentStrategy implements IMoveDepartmentStrategy {
  name: string = SyncStrategyType.MoveDepartment

  async exec(ctx: IMoveDepartmentContext): Promise<IMoveDepartmentResult> {
    let { engine, parent, dept, task } = ctx
    log.debug({ info: `full sync ${task.taskId} moveDept deptId: ${dept.dept_id} deptName: ${dept.name} parentId: ${parent?.dept_id} start` })

    const tick = new Ticker()
    try {
      // 1. 判断移动过来之后是否重名
      await engine.was.moveDepartment(dept.company_id, dept, parent)
      dept.abs_path = `${parent.abs_path}/${dept.name}`
      dept.dept_pid = parent.dept_id
      log.i({ info: `full sync ${task.taskId} moveDept deptId: ${dept.dept_id} deptName: ${dept.name} parentId: ${parent.dept_id} success[${tick.end()}]` })
    } catch (err) {
      await this.handleDeptNameExists(task, dept, parent, err)
    }
    return { code: 'ok' }
  }

  async handleDeptNameExists(task: SyncTask, dept: WPSDepartment, parent: WPSDepartment, err: any) {
    let resCode = err.response?.data?.code
    if (resCode == WpsApiErrorCode.DeptNameExists &&
        config.strategy.dept_name_conflict == IncrementSyncDeptNameConflict.RENAME
    ) {
      let suffix: string
      if (dept.third_dept_id.length > 16) {
        let md5Str = md5(dept.third_dept_id)
        suffix = `_${md5Str}`
      } else {
        suffix = `_${dept.third_dept_id}`
      }
      let name = `${dept.name}${suffix}`
      if (name.length > 255) {
        name = `${dept.name.substring(0, 255 - suffix.length)}${suffix}`
      }
      await sync.ctx.engine.was.updateDepartment(dept.company_id, dept, null, name, dept.order)
      await sync.ctx.engine.was.moveDepartment(dept.company_id, dept, parent)
      dept.abs_path = `${parent.abs_path}/${name}`
      dept.dept_pid = parent.dept_id
      log.i({ info: `full sync ${task.taskId} moveDept handleDeptNameExists deptId: ${dept.dept_id} deptName: ${name} parentId: ${parent.dept_id} success` })
    } else {
      throw err
    }
  }
}
