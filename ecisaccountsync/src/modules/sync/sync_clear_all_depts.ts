import { SyncContext } from './context'
import {LocalAccountSystem, LocalDepartment, V7AccountSystem} from "../../sdk/account";

export default async function syncClearAllDepts(
  ctx: SyncContext,
  taskId: string,
  lCompanyId: string,
  wCompanyId: string,
  platformId: string,
) {
  const { was, las } = ctx
  const root = await las.root(taskId, lCompanyId)
  const _ctx = {
    was, las, taskId, lCompanyId, wCompanyId, platformId, parent: root,
  }
  await delDepts(_ctx)
}

async function delDepts(ctx: {
  was: V7AccountSystem, las: LocalAccountSystem, taskId: string, lCompanyId: string,wCompanyId: string, platformId: string, parent: LocalDepartment
}) {
  const { was, las, taskId, lCompanyId, wCompanyId, platformId, parent } = ctx
  const depts = await las.listDepartments(taskId, lCompanyId, platformId, parent.did)
  if (depts && depts.length > 0) {
    for (const dept of depts) {
      const _ctx = {
        was, las, taskId, lCompanyId, wCompanyId, platformId, parent: dept,
      }
      await delDepts(_ctx)
    }
  }
  const wDept = await was.queryDeptsByThirdUnionId(wCompanyId, platformId, parent.did)
  if (wDept && wDept.dept_id !== '1') {
    // 删除部门
    await was.removeDepartment(wCompanyId, wDept)
  }
}
