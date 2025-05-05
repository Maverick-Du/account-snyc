import {getOriginContent, getUserPassword, IncrementStrategyType, IncrementSyncContext} from '../types'
import {IncrementStatus} from '../../../db/types'
import las from '../../../service/LasIncrementService'
import { LasUserIncrementSchema } from '../../../db/tables/LasUserIncrement'
import sync from '../../../sync'
import {DEFAULT_ROOT_DEPT_P_ID, WPSDepartment, WpsGenderType, WPSUser, WPSUserStatus} from "../../../../sdk/account";
import {log, Strategy, StrategyResult} from "../../../../sdk/cognac";

export class IncrementUserAddStrategy implements Strategy<IncrementSyncContext, StrategyResult> {
    name: string = IncrementStrategyType.UserAdd

    async exec(ctx: IncrementSyncContext): Promise<StrategyResult> {
        ctx.statistics.total ++
        let user = ctx.userIncrement
        log.i({ info: `increment sync userAdd companyId: ${ctx.cfg.companyId}, uid: ${user.uid}, did: ${user.def_did}, account: ${user.account} start`})
        try {
            const data = await this.checkData(ctx, user)
            if (!data.flag) {
                ctx.statistics.user_fail++
                await las.updateUserSyncData(user.id, IncrementStatus.FAIL, data.msg)
                return null
            }
            if (!data.user) {
                // 新增
                ctx.statistics.user_add ++
                await this.addUser(user, data)
            } else {
                // 修改
                ctx.statistics.user_update ++
                await this.updateUser(ctx, user, data)
            }
            await las.updateUserSyncData(user.id, IncrementStatus.SUCCESS, data.msg)
        } catch (err) {
            err.msg = `increment sync userAdd throw err. msg: ${err.message}, user: ${JSON.stringify(user)}`
            log.e(err)
            ctx.statistics.user_fail++
            await las.updateUserSyncData(user.id, IncrementStatus.FAIL, err.message?.substring(0,2000))
        }
        log.i({ info: `increment sync userAdd companyId: ${ctx.cfg.companyId}, uid: ${user.uid}, account: ${user.account} end`})
        return null
    }

    private async addUser(user: LasUserIncrementSchema, data: CheckResponseData): Promise<void> {
        user.def_did = data.dept.dept_id
        // addUser
        let pass = getUserPassword(user)
        let wpsUser = await sync.ctx.engine.was.addUser(data.companyId, user.account, pass, user.nick_name, user.platform_id, user.uid, user.def_did, user.def_did_order || 0, {
            source: user.source as any,
            email: user.email ? user.email : null,
            gender: user.gender ? user.gender : null,
            telephone: user.telephone ? getOriginContent(user, user.telephone) : null,
            mobile_phone: user.phone ? getOriginContent(user, user.phone) : null,
            title: user.title ? user.title : null,
            work_place: user.work_place ? user.work_place : null,
            leader: user.leader ? user.leader : null,
            employee_id: user.employer ? user.employer : null,
            employment_type: user.employment_type ? user.employment_type : null,
            avatar: user.avatar ? user.avatar : null,
            custom_fields: user.custom_fields ? JSON.parse(user.custom_fields) : null,
        })
        if (data.rootTemp && wpsUser) {
            await las.addRootDeptTempUser({
                company_id: data.companyId,
                uid: wpsUser.user_id
            })
        }
    }

    private async updateUser(ctx: IncrementSyncContext, user: LasUserIncrementSchema, data: CheckResponseData): Promise<void> {
        // updateUser
        await sync.ctx.engine.was.updateUser(data.user.company_id, data.user.user_id, {
            login_name: user.account ? user.account : null,
            avatar: user.avatar ? user.avatar : null,
            custom_fields: user.custom_fields ? JSON.parse(user.custom_fields) : null,
            email: user.email ? user.email : null,
            employee_id: user.employer ? user.employer : null,
            employment_type: user.employment_type ? user.employment_type : null,
            gender: user.gender ? user.gender : WpsGenderType.Secrecy,
            leader: user.leader ? user.leader : null,
            mobile_phone: user.phone ? getOriginContent(user, user.phone) : null,
            telephone: user.telephone ? getOriginContent(user, user.telephone) : null,
            nick_name: user.nick_name ? user.nick_name : null,
            source: user.source as any,
            title: user.title ? user.title : null,
            work_place: user.work_place ? user.work_place : null
        })
        log.i({ info: `increment sync userAdd updateUser companyId: ${ctx.cfg.companyId}, uid: ${user.uid}, account: ${user.account}`})

        if (data.user.status != user.employment_status) {
            if (data.user.status == WPSUserStatus.Disabled && user.employment_status == WPSUserStatus.Active) {
                await sync.ctx.engine.was.enableUsers(data.user.company_id, [data.user], true)
            } else if (user.employment_status == WPSUserStatus.Disabled) {
                await sync.ctx.engine.was.enableUsers(data.user.company_id, [data.user], false)
            }
        }

    }

    private async checkData(ctx: IncrementSyncContext, user: LasUserIncrementSchema): Promise<CheckResponseData> {
        try {
            let cfg = ctx.cfg
            let companyId = cfg.companyId
            if (!user.account || !user.nick_name || !user.uid) {
                return {
                    flag: false,
                    msg: `缺失account/nick_name/uid等关键参数无法创建用户`
                }
            }
            if (user.leader) {
                let leaderUser = await sync.ctx.engine.was.queryUsersByThirdUnionId(companyId, user.platform_id, user.leader)
                if (!leaderUser) {
                    return {
                        flag: false,
                        msg: `用户leader不存在，leader: ${user.leader}`
                    }
                }
                user.leader = leaderUser.user_id
            }
            let dept = null
            let rootTemp = false
            if (!user.def_did || user.def_did == DEFAULT_ROOT_DEPT_P_ID) {
                dept = await sync.ctx.engine.was.root(companyId)
                if (!dept) {
                    return {
                        flag: false,
                        msg: `当前企业根部门不存在, companyId: ${companyId}`
                    }
                }
                if (!user.def_did) {
                    rootTemp = true
                }
            } else {
                dept = await sync.ctx.engine.was.queryDeptsByThirdUnionId(companyId, user.platform_id, user.def_did)
                if (!dept) {
                    return {
                        flag: false,
                        msg: `默认部门不存在, did: ${user.def_did}`
                    }
                }
            }
            let exist = await sync.ctx.engine.was.queryUsersByThirdUnionId(companyId, user.platform_id, user.uid)
            return {
                flag: true,
                msg: 'success',
                companyId: companyId,
                user: exist,
                rootTemp: rootTemp,
                dept: dept
            }
        } catch (err) {
            err.msg = `increment sync userAdd handleCheckData throw err. msg: ${err.message}, user: ${JSON.stringify(user)}`
            log.e(err)
            return {
                flag: false,
                msg: err.message
            }
        }
    }
}

interface CheckResponseData {
    companyId?: string
    flag: boolean
    msg: string
    user?: WPSUser
    rootTemp?: boolean
    dept?: WPSDepartment
}
