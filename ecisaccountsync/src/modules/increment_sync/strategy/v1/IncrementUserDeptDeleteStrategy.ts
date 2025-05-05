import {IncrementStrategyType, IncrementSyncContext} from '../types'
import {IncrementStatus} from '../../../db/types'
import las from '../../../service/LasIncrementService'
import { LasDeptUserIncrementSchema } from '../../../db/tables/LasDepartmentUserIncrement'
import {WPSUser, WPSDepartment, DEFAULT_ROOT_DEPT_P_ID} from '../../../../sdk/account'
import sync from '../../../sync'
import {log, Strategy, StrategyResult} from "../../../../sdk/cognac";

export class IncrementUserDeptDeleteStrategy implements Strategy<IncrementSyncContext, StrategyResult> {
    name: string = IncrementStrategyType.UserDeptDelete

    async exec(ctx: IncrementSyncContext): Promise<StrategyResult> {
        ctx.statistics.user_dept_delete ++
        ctx.statistics.total ++
        let userDept = ctx.deptUserIncrement
        log.i({ info: `increment sync userDeptDelete companyId: ${ctx.cfg.companyId}, uid: ${userDept.uid}, did: ${userDept.did} start`})
        try {
            let data = await this.checkDeptData(ctx, userDept)
            if (!data.flag) {
                ctx.statistics.user_dept_fail++
                await las.updateDeptUserSyncData(userDept.id, IncrementStatus.FAIL, data.msg)
                return null
            }
            // 判断是否为最后一个部门，最后一个部门需要将用户加入到根部门下
            await IncrementUserDeptDeleteStrategy.addRootDeptTemp(data.companyId, data.user)
            await sync.ctx.engine.was.removeUserFromDepartment(data.companyId, data.dept, data.user.user_id)
            await las.updateDeptUserSyncData(userDept.id, IncrementStatus.SUCCESS, data.msg)
        } catch (err) {
            err.msg = `increment sync userDeptDelete throw error. msg: ${err.message}, dept: ${JSON.stringify(userDept)}`
            log.e(err)
            ctx.statistics.user_dept_fail++
            await las.updateDeptUserSyncData(userDept.id, IncrementStatus.FAIL, err.message?.substring(0,2000))
        }
        log.i({ info: `increment sync userDeptDelete strategy end... companyId: ${ctx.cfg.companyId}, uid: ${userDept.uid}, did: ${userDept.did}`})
        return null
    }

    private static async addRootDeptTemp(companyId: string, user: WPSUser) {
        const depts = await sync.ctx.engine.was.listDepartmentsByUser(companyId, user)
        if (depts.length === 1) {
            const rootDept = await sync.ctx.engine.was.root(companyId)
            if (!rootDept) {
                throw new Error(`当前企业根部门不存在, companyId: ${companyId}`)
            }
            if (depts[0].dept_id == rootDept.dept_id) {
                throw new Error(`当前部门为最后一个部门且为根部门，无法退出, companyId: ${companyId}`)
            }
            await sync.ctx.engine.was.addUserToDepartment(
                companyId,
                rootDept,
                user.user_id,
                0,
                false,
            )
            await las.addRootDeptTempUser({
                company_id: companyId,
                uid: user.user_id
            })
        }
    }

    private async checkDeptData(ctx: IncrementSyncContext, userDept: LasDeptUserIncrementSchema): Promise<CheckResponseData> {
        try {
            let cfg = ctx.cfg
            let companyId = cfg.companyId
            if (!userDept.uid || !userDept.did) {
                return {
                    flag: false,
                    msg: `缺失uid/did等关键参数无法删除用户部门关系`
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
            for (const dd of deptsList) {
                if (dd.dept_id == dept.dept_id) {
                    existUser = true
                    break
                }
            }
            if (!existUser) {
                return {
                    flag: false,
                    msg: `部门下该用户不存在, uid: ${userDept.uid}, did: ${userDept.did}`
                }
            }

            return {
                flag: true,
                msg: "success",
                user: user,
                dept: dept,
                companyId: companyId
            }
        } catch (err) {
            err.msg = `increment sync userDeptDelete handleDeptData throw error. msg: ${err.message}, dept: ${JSON.stringify(userDept)}`
            log.e(err)
            return {
                flag: false,
                msg: err.message
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
}
