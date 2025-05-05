import {IncrementStrategyType, IncrementSyncContext} from '../types'
import {IncrementStatus} from '../../../db/types'
import las from '../../../service/LasIncrementService'
import {LasDeptIncrementSchema} from '../../../db/tables/LasDepartmentIncrement'
import {CheckResponseData} from './IncrementDeptAddStrategy'
import sync from '../../../sync'
import {log, Strategy, StrategyResult} from "../../../../sdk/cognac";

export class IncrementDeptDeleteStrategy implements Strategy<IncrementSyncContext, StrategyResult> {
    name: string = IncrementStrategyType.DeptDelete

    async exec(ctx: IncrementSyncContext): Promise<StrategyResult> {
        ctx.statistics.dept_delete ++
        ctx.statistics.total ++
        let dept = ctx.deptIncrement
        log.i({ info: `increment sync deptDelete companyId: ${ctx.cfg.companyId}, did: ${dept.did}, name: ${dept.name} start`})
        try {
            let data = await this.checkDeptData(ctx, dept)
            if (!data.flag) {
                ctx.statistics.dept_fail++
                await las.updateDeptSyncData(dept.id, IncrementStatus.FAIL, data.msg)
                return null
            }
            let exist = data.exist
            // add
            await sync.ctx.engine.was.removeDepartment(exist.company_id, exist)
            await las.updateDeptSyncData(dept.id, IncrementStatus.SUCCESS, data.msg)
        } catch (err) {
            err.msg = `increment sync deptDelete throw error. msg: ${err.message}, dept: ${JSON.stringify(dept)}`
            log.e(err)
            ctx.statistics.dept_fail++
            await las.updateDeptSyncData(dept.id, IncrementStatus.FAIL, err.message?.substring(0,2000))
        }
        log.i({ info: `increment sync deptDelete companyId: ${ctx.cfg.companyId}, did: ${dept.did} end`})
        return null
    }

    async checkDeptData(ctx: IncrementSyncContext, dept: LasDeptIncrementSchema): Promise<CheckResponseData> {
        try {
            let cfg = ctx.cfg
            let companyId = cfg.companyId
            let exist = await sync.ctx.engine.was.queryDeptsByThirdUnionId(companyId, dept.platform_id, dept.did)
            if (!exist) {
                return {
                    flag: false,
                    msg: `部门不存在, did: ${dept.did}`
                }
            }
            // 部门下是否还有用户
            const deptUsers = await sync.ctx.engine.was.listUsersByDepartment(companyId, exist, 0, 10)
            if (!deptUsers) {
                return {
                    flag: false,
                    msg: `部门下存在用户, did: ${dept.did}`
                }
            }
            // 是否还有子部门
            const subs = await sync.ctx.engine.was.listDepartments(companyId, exist, 0, 1)
            if (!subs) {
                return {
                    flag: false,
                    msg: `部门下存在子部门, did: ${dept.did}`
                }
            }
            return {
                exist: exist,
                flag: true,
                msg: "success"
            }
        } catch (err) {
            err.msg = `increment sync deptDelete handleDeptData throw error. msg: ${err.message}, dept: ${JSON.stringify(dept)}`
            log.e(err)
            return {
                flag: false,
                msg: err.message
            }
        }
    }
}
