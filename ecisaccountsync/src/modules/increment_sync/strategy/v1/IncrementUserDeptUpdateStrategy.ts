import {IncrementStrategyType, IncrementSyncContext} from '../types'
import {IncrementStatus} from '../../../db/types'
import las from '../../../service/LasIncrementService'
import { LasDeptUserIncrementSchema } from '../../../db/tables/LasDepartmentUserIncrement'
import {WPSUser, WPSDepartment, LocalMemberMainEnum, DEFAULT_ROOT_DEPT_P_ID} from '../../../../sdk/account'
import sync from '../../../sync'
import {log, Strategy, StrategyResult} from "../../../../sdk/cognac";

export class IncrementUserDeptUpdateStrategy implements Strategy<IncrementSyncContext, StrategyResult> {
    name: string = IncrementStrategyType.UserDeptUpdate

    async exec(ctx: IncrementSyncContext): Promise<StrategyResult> {
        ctx.statistics.total ++
        ctx.statistics.user_dept_sort_update ++
        let userDept = ctx.deptUserIncrement
        log.i({ info: `increment sync userDeptUpdate companyId: ${ctx.cfg.companyId}, uid: ${userDept.uid}, did: ${userDept.did}, order: ${userDept.order}, main: ${userDept.main} start`})
        try {
            let data = await this.checkDeptData(ctx, userDept)
            if (!data.flag) {
                ctx.statistics.user_dept_fail ++
                await las.updateDeptUserSyncData(userDept.id, IncrementStatus.FAIL, data.msg)
                return null
            }
            // 更新排序值
            await sync.ctx.engine.was.updateDepartmentMembersOrder(data.companyId, [{
                user_id: data.user.user_id,
                dept_id: data.dept.dept_id,
                order: userDept.order || 0
            }])
            // 更新主部门
            if (
                userDept.main === LocalMemberMainEnum.TRUE &&
                data.user.def_dept_id !== data.dept.dept_id
            ) {
                await sync.ctx.engine.was.addUserToDepartment(
                    data.dept.company_id,
                    data.dept,
                    data.user.user_id,
                    userDept.order,
                    true,
                )
                ctx.statistics.user_dept_main_update ++
            }
            await las.updateDeptUserSyncData(userDept.id, IncrementStatus.SUCCESS, data.msg)
        } catch (err) {
            err.msg = `increment sync userDeptUpdate throw error. msg: ${err.message}, dept: ${JSON.stringify(userDept)}`
            log.error(err)
            ctx.statistics.user_dept_fail ++
            await las.updateDeptUserSyncData(userDept.id, IncrementStatus.FAIL, err.message?.substring(0,2000))
        }
        log.i({ info: `increment sync userDeptUpdate companyId: ${ctx.cfg.companyId}, uid: ${userDept.uid}, did: ${userDept.did} end`})
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
            err.msg = `increment sync userDeptUpdate handleDeptData throw error. msg: ${err.message}, dept: ${JSON.stringify(userDept)}`
            log.error(err)
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
