import { Context, root } from '../../sdk/cognac/server'
import { Result } from '../../common/type'
import kscimService from '../../modules/kscim/KSCIMService'
import { log } from '../../sdk/cognac'

// 保存配置
root.post('/manage/v7/ecisaccountsync/kscim/config-save', async (ctx: Context) => {
    try {
        const thirdCompanyId = Number(ctx.request.body.third_company_id)
        if (!thirdCompanyId) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "third_company_id is empty")
            return ctx
        }

        const config = {
            DepUrl: ctx.request.body.DepUrl,
            UserUrl: ctx.request.body.UserUrl,
            TokenName: ctx.request.body.TokenName,
            TokenValue: ctx.request.body.TokenValue,
            RootDepLdName: ctx.request.body.RootDepLdName,
            RootDopLdValue: ctx.request.body.RootDopLdValue,
            RootDepName: ctx.request.body.RootDepName
        }

        ctx.body = await kscimService.saveConfig(thirdCompanyId, config)
    } catch (err) {
        log.error("保存KSCIM配置失败", err)
        ctx.body = new Result(Result.FAIL_CODE, "保存失败")
    }
    return ctx
})

// 获取配置
root.get('/manage/v7/ecisaccountsync/kscim/config', async (ctx: Context) => {
    try {
        const thirdCompanyId = Number(ctx.query.third_company_id)
        if (!thirdCompanyId) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "third_company_id is empty")
            return ctx
        }

        ctx.body = await kscimService.getConfig(thirdCompanyId)
    } catch (err) {
        log.error("获取KSCIM配置失败", err)
        ctx.body = new Result(Result.FAIL_CODE, "获取失败")
    }
    return ctx
})

// 测试连接
root.post('/manage/v7/ecisaccountsync/kscim/test', async (ctx: Context) => {
    try {
        const thirdCompanyId = Number(ctx.request.body.third_company_id)
        if (!thirdCompanyId) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "third_company_id is empty")
            return ctx
        }

        ctx.body = await kscimService.testConnection(thirdCompanyId)
    } catch (err) {
        log.error("KSCIM连接测试失败", err)
        ctx.body = new Result(Result.FAIL_CODE, "测试失败")
    }
    return ctx
})

// 保存字段映射
root.post('/manage/v7/ecisaccountsync/kscim/field-save', async (ctx: Context) => {
    try {
        const thirdCompanyId = Number(ctx.request.body.third_company_id)
        if (!thirdCompanyId) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "third_company_id is empty")
            return ctx
        }

        const mapping = {
            uid: ctx.request.body.uid,
            def_did: ctx.request.body.def_did,
            def_did_order: ctx.request.body.def_did_order,
            account: ctx.request.body.account,
            nick_name: ctx.request.body.nick_name,
            password: ctx.request.body.password,
            avatar: ctx.request.body.avatar,
            email: ctx.request.body.email,
            gender: ctx.request.body.gender,
            title: ctx.request.body.title,
            work_place: ctx.request.body.work_place,
            leader: ctx.request.body.leader,
            employer: ctx.request.body.employer,
            employment_status: ctx.request.body.employment_status,
            employment_type: ctx.request.body.employment_type,
            phone: ctx.request.body.phone,
            telephone: ctx.request.body.telephone,
            did: ctx.request.body.did,
            pid: ctx.request.body.pid,
            name: ctx.request.body.name,
            order: ctx.request.body.order
        }

        ctx.body = await kscimService.saveFieldMapping(thirdCompanyId, mapping)
    } catch (err) {
        log.error("保存字段映射失败", err)
        ctx.body = new Result(Result.FAIL_CODE, "保存失败")
    }
    return ctx
})

// 获取字段映射
root.get('/manage/v7/ecisaccountsync/kscim/field-mapping', async (ctx: Context) => {
    try {
        const thirdCompanyId = Number(ctx.query.third_company_id)
        if (!thirdCompanyId) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "third_company_id is empty")
            return ctx
        }

        ctx.body = await kscimService.getFieldMapping(thirdCompanyId)
    } catch (err) {
        log.error("获取字段映射失败", err)
        ctx.body = new Result(Result.FAIL_CODE, "获取失败")
    }
    return ctx
})

// 同步数据
root.post('/manage/v7/ecisaccountsync/kscim/sync', async (ctx: Context) => {
    try {
        const thirdCompanyId = Number(ctx.request.body.third_company_id)
        if (!thirdCompanyId) {
            ctx.body = new Result(Result.PARAM_ERROR_CODE, "third_company_id is empty")
            return ctx
        }

        ctx.body = await kscimService.syncData(thirdCompanyId)
    } catch (err) {
        log.error("KSCIM数据同步失败", err)
        ctx.body = new Result(Result.FAIL_CODE, "同步失败")
    }
    return ctx
}) 