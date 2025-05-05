import {IncrementStrategyType, IncrementSyncContext} from '../types'
import {IncrementStatus} from '../../../db/types'
import las from '../../../service/LasIncrementService'
import { LasDeptUserIncrementSchema } from '../../../db/tables/LasDepartmentUserIncrement'
import {WPSUser, WPSDepartment, DEFAULT_ROOT_DEPT_P_ID, DeptAndWeight} from '../../../../sdk/account'
import sync from '../../../sync'
import {log, Strategy, StrategyResult} from "../../../../sdk/cognac";

export class IncrementUserDeptMoveStrategy implements Strategy<IncrementSyncContext, StrategyResult> {
    name: string = IncrementStrategyType.UserDeptMove

    async exec(ctx: IncrementSyncContext): Promise<StrategyResult> {
        ctx.statistics.total ++
        let userDept = ctx.deptUserIncrement
        log.i({ info: `increment sync userDeptMove companyId: ${ctx.cfg.companyId}, uid: ${userDept.uid}, did: ${userDept.did}, order: ${userDept.order}, main: ${userDept.main} start`})
        try {
            let data = await this.checkDeptData(ctx, userDept)
            if (!data.flag) {
                ctx.statistics.user_dept_fail ++
                await las.updateDeptUserSyncData(userDept.id, IncrementStatus.FAIL, data.msg)
                return null
            }
            let old_dept_ids = data.oldDepts.map(d => d.dept_id)
            await sync.ctx.engine.was.changeAccountDept(data.companyId, {
                account_id: data.user.user_id,
                def_dept_id: data.dept.dept_id,
                new_dept_ids: data.newDepts,
                old_dept_ids: old_dept_ids
            })
            await las.delRootDeptTempUser(data.companyId, data.user.user_id)
            ctx.statistics.user_dept_add += data.newDepts.length
            ctx.statistics.user_dept_delete += old_dept_ids.length
            await las.updateDeptUserSyncData(userDept.id, IncrementStatus.SUCCESS, data.msg)
        } catch (err) {
            err.msg = `increment sync userDeptMove throw error. msg: ${err.message}, dept: ${JSON.stringify(userDept)}`
            log.e(err)
            ctx.statistics.user_dept_fail ++
            await las.updateDeptUserSyncData(userDept.id, IncrementStatus.FAIL, err.message?.substring(0,2000))
        }
        log.i({ info: `increment sync userDeptMove companyId: ${ctx.cfg.companyId}, uid: ${userDept.uid}, did: ${userDept.did} end`})
        return null
    }

    private async checkDeptData(ctx: IncrementSyncContext, userDept: LasDeptUserIncrementSchema): Promise<CheckResponseData> {
        try {
            let cfg = ctx.cfg
            let companyId = cfg.companyId
            if (!userDept.uid || !userDept.did) {
                return {
                    flag: false,
                    msg: `缺失uid/did等关键参数无法更新用户部门关系`
                }
            }
            const user = await sync.ctx.engine.was.queryUsersByThirdUnionId(companyId, userDept.platform_id, userDept.uid)
            if (!user) {
                return {
                    flag: false,
                    msg: `用户不存在, uid: ${userDept.uid}`
                }
            }
            let depts: DeptAndWeight[] = []
            let dept = null
            if (userDept.did == DEFAULT_ROOT_DEPT_P_ID) {
                dept = await sync.ctx.engine.was.root(companyId)
                if (!dept) {
                    return {
                        flag: false,
                        msg: `未找到对应的根部门信息, did: ${userDept.did}`
                    }
                }
            } else {
                dept = await sync.ctx.engine.was.queryDeptsByThirdUnionId(companyId, userDept.platform_id, userDept.did)
                if (!dept) {
                    return {
                        flag: false,
                        msg: `部门不存在, did: ${userDept.did}`
                    }
                }
            }
            if (userDept.dids) {
                let deptOrders = this.parseDids(userDept.dids)
                let dids1: string[] = []
                let deptOrderMap = new Map<string, number>()
                for (const deptOrder of deptOrders) {
                    if (!deptOrder.did) {
                        throw new Error("dids中did为空")
                    }
                    if (deptOrder.did == DEFAULT_ROOT_DEPT_P_ID) {
                        let rootDept = await sync.ctx.engine.was.root(companyId)
                        if (rootDept) {
                            depts.push({dept_id: rootDept.dept_id, weight: deptOrder.order || 0} as DeptAndWeight)
                        }
                    } else {
                        dids1.push(deptOrder.did)
                        deptOrderMap.set(deptOrder.did, deptOrder.order || 0)
                    }
                }
                if (dids1.length > 0) {
                    let ds = await sync.ctx.engine.was.queryDeptsByThirdUnionIds(companyId, userDept.platform_id, dids1)
                    for (const d of ds) {
                        depts.push({dept_id: d.dept_id, weight: deptOrderMap.get(d.third_dept_id)} as DeptAndWeight)
                    }
                }
            } else {
                depts.push({dept_id: dept.dept_id, weight: userDept.order || 0})
            }

            if (depts.length <= 0) {
                return {
                    flag: false,
                    msg: `部门不存在, did: ${userDept.did}`
                }
            }

            let deptsList = await sync.ctx.engine.was.listDepartmentsByUser(companyId, user)
            return {
                flag: true,
                msg: "success",
                companyId: companyId,
                user: user,
                dept: dept,
                oldDepts: deptsList,
                newDepts: depts,
            }
        } catch (err) {
            err.msg = `increment sync userDeptUpdate handleDeptData throw error. msg: ${err.message}, dept: ${JSON.stringify(userDept)}`
            log.e(err)
            return {
                flag: false,
                msg: err.message
            }
        }
    }

    private parseDids(dids: string): DeptAndOrder[] {
        try {
            return JSON.parse(dids) as DeptAndOrder[]
        } catch (err) {
            throw new Error("dids格式错误, 无法解析")
        }
    }
}

interface CheckResponseData {
    flag: boolean,
    msg: string,
    user?: WPSUser,
    dept?: WPSDepartment,
    newDepts?: DeptAndWeight[],
    oldDepts?: WPSDepartment[],
    companyId?: string
}

interface DeptAndOrder {
    did: string,
    order: number
}


