import {IncrementStrategyType, IncrementSyncContext} from '../types'
import {IncrementStatus} from '../../../db/types'
import las from '../../../service/LasIncrementService'
import { LasDeptUserIncrementSchema } from '../../../db/tables/LasDepartmentUserIncrement'
import {WPSUser, WPSDepartment, DEFAULT_ROOT_DEPT_P_ID} from '../../../../sdk/account'
import sync from '../../../sync'
import {log, Strategy, StrategyResult} from "../../../../sdk/cognac";

export class IncrementUserDeptAddStrategy implements Strategy<IncrementSyncContext, StrategyResult> {
    name: string = IncrementStrategyType.UserDeptAdd

    async exec(ctx: IncrementSyncContext): Promise<StrategyResult> {
        ctx.statistics.user_dept_add ++
        ctx.statistics.total ++
        let userDept = ctx.deptUserIncrement
        log.i({ info: `increment sync userDeptAdd companyId: ${ctx.cfg.companyId}, uid: ${userDept.uid}, did: ${userDept.did}, order: ${userDept.order}, main: ${userDept.main} start`})
        try {
            let data = await this.checkDeptData(ctx, userDept)
            if (!data.flag) {
                ctx.statistics.user_dept_fail++
                await las.updateDeptUserSyncData(userDept.id, IncrementStatus.FAIL, data.msg)
                return null
            }
            // addUserDept
            await sync.ctx.engine.was.addUserToDepartment(data.companyId, data.dept, data.user.user_id, userDept.order || 0, !!userDept.main)
            await IncrementUserDeptAddStrategy.handleRootDeptTempUser(data.companyId, data.user.user_id, data.dept, data.deptsList)
            await las.updateDeptUserSyncData(userDept.id, IncrementStatus.SUCCESS, data.msg)
        } catch (err) {
            err.msg = `increment sync userDeptAdd throw error. msg: ${err.message}, dept: ${JSON.stringify(userDept)}`
            log.e(err)
            ctx.statistics.user_dept_fail++
            await las.updateDeptUserSyncData(userDept.id, IncrementStatus.FAIL, err.message?.substring(0,2000))
        }
        log.i({ info: `increment sync userDeptAdd companyId: ${ctx.cfg.companyId}, uid: ${userDept.uid}, did: ${userDept.did} end`})
        return null
    }

    private async checkDeptData(ctx: IncrementSyncContext, userDept: LasDeptUserIncrementSchema): Promise<CheckResponseData> {
        try {
            let cfg = ctx.cfg
            let companyId = cfg.companyId
            if (!userDept.uid || !userDept.did) {
                return {
                    flag: false,
                    msg: `缺失uid/did等关键参数无法创建用户部门关系`
                }
            }
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
            const user = await sync.ctx.engine.was.queryUsersByThirdUnionId(companyId, userDept.platform_id, userDept.uid)
            if (!user) {
                return {
                    flag: false,
                    msg: `用户不存在, uid: ${userDept.uid}`
                }
            }
            let deptsList = await sync.ctx.engine.was.listDepartmentsByUser(companyId, user)
            let existUser: boolean = false
            for (const d of deptsList) {
                if (d.dept_id == dept.dept_id) {
                    existUser = true
                    break
                }
            }
            if (existUser) {
                await IncrementUserDeptAddStrategy.handleRootDeptTempUser(companyId, user.user_id, dept, deptsList)
                return {
                    flag: false,
                    msg: `部门下该用户已存在, uid: ${userDept.uid}, did: ${userDept.did}`
                }
            }

            return {
                flag: true,
                msg: "success",
                user: user,
                dept: dept,
                companyId: companyId,
                deptsList: deptsList
            }
        } catch (err) {
            err.msg = `increment sync userDeptAdd handleDeptData throw error. msg: ${err.message}, dept: ${JSON.stringify(userDept)}`
            log.e(err)
            return {
                flag: false,
                msg: err.message
            }
        }
    }

    // 移除临时添加到根部门的用户
    private static async handleRootDeptTempUser(companyId: string, user_id: string, addDept: WPSDepartment, deptsList: WPSDepartment[]) {
        let temp = await las.getRootDeptTempUser(companyId, user_id)
        if (temp) {
            const rootDept = await sync.ctx.engine.was.root(companyId)
            if (!rootDept) {
                log.e(`increment sync userDeptAdd not found company root dept. companyId: ${companyId}`)
                return
            }
            if (addDept.dept_id == rootDept.dept_id) {
                await las.delRootDeptTempUser(companyId, user_id)
            } else {
                await las.delRootDeptTempUser(companyId, user_id)
                for (const d of deptsList) {
                    if (d.dept_id == rootDept.dept_id) {
                        await sync.ctx.engine.was.removeUserFromDepartment(companyId, rootDept, user_id)
                    }
                }
            }
        }
    }
}


interface CheckResponseData {
    flag: boolean,
    msg: string,
    user?: WPSUser,
    dept?: WPSDepartment
    companyId?: string
    deptsList?: WPSDepartment[]
}
