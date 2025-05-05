import {IncrementStrategyType, IncrementSyncContext} from '../types'
import {IncrementStatus} from '../../../db/types'
import las from '../../../service/LasIncrementService'
import { LasUserIncrementSchema } from '../../../db/tables/LasUserIncrement'
import { WPSUser } from '../../../../sdk/account'
import sync from '../../../sync'
import {log, Strategy, StrategyResult} from "../../../../sdk/cognac";

export class IncrementUserDeleteStrategy implements Strategy<IncrementSyncContext, StrategyResult> {
    name: string = IncrementStrategyType.UserDelete

    async exec(ctx: IncrementSyncContext): Promise<StrategyResult> {
        ctx.statistics.user_delete ++
        ctx.statistics.total ++
        let user = ctx.userIncrement
        log.i({ info: `increment sync userDelete companyId: ${ctx.cfg.companyId}, uid: ${user.uid}, account: ${user.account} start`})
        try {
            const data = await this.checkData(ctx, user)
            if (!data.flag) {
                ctx.statistics.user_fail++
                await las.updateUserSyncData(user.id, IncrementStatus.FAIL, data.msg)
                return null
            }
            // deleteUser
            await sync.ctx.engine.was.deleteUser(data.user.company_id, data.user)
            await las.delRootDeptTempUser(data.user.company_id, data.user.user_id)
            await las.updateUserSyncData(user.id, IncrementStatus.SUCCESS, data.msg)
        } catch (err) {
            err.msg = `increment sync userDelete throw err. msg: ${err.message}, user: ${JSON.stringify(user)}`
            log.e(err)
            ctx.statistics.user_fail++
            await las.updateUserSyncData(user.id, IncrementStatus.FAIL, err.message?.substring(0,2000))
        }
        log.i({ info: `increment sync userDelete companyId: ${ctx.cfg.companyId}, uid: ${user.uid}, account: ${user.account} end`})
        return null
    }

    private async checkData(ctx: IncrementSyncContext, user: LasUserIncrementSchema): Promise<CheckResponseData> {
        try {
            let cfg = ctx.cfg
            let companyId = cfg.companyId
            let exist = await sync.ctx.engine.was.queryUsersByThirdUnionId(companyId, user.platform_id, user.uid)
            if (!exist) {
                return {
                    flag: false,
                    msg: `用户不存在，uid: ${user.uid}`
                }
            }
            return {
                flag: true,
                msg: 'success',
                user: exist
            }
        } catch (err) {
            err.msg = `increment sync userDelete handleCheckData throw err. msg: ${err.message}, user: ${JSON.stringify(user)}`
            log.e(err)
            return {
                flag: false,
                msg: err.message
            }
        }
    }
}

interface CheckResponseData {
    user?: WPSUser
    flag: boolean
    msg: string

}
