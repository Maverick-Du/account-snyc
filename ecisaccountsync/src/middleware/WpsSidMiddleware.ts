import {Middleware} from "koa";
import config from "../common/config";
import {Result} from "../common/type";
import docMini from '../common/docmini'
import { log } from "../sdk/cognac/common";

class WpsSidMiddleware {
    checkWpsSid(): Middleware {
        const mid: Middleware = async (ctx, next) => {
            try {
                log.i({ method: 'WpsSidMiddleware ctx.header.cookie', data: ctx.header.cookie })
                if (
                    config.isAuth === 'false' ||
                    (ctx.url.indexOf('/api/manage') < 0 && ctx.url.indexOf('/api/test') < 0)
                ) {
                    // 放行
                    await next()
                    return
                }
                const wpsSid = ctx.cookies.get('wps_sid')
                if (!wpsSid) {
                    ctx.body = new Result(Result.NOT_LOGIN_CODE, "请先登录")
                    return ctx
                }
                let userResult = await docMini.getCurrentUser(wpsSid)
                if (!userResult || !userResult.data) {
                    ctx.body = new Result(Result.NOT_LOGIN_CODE, "请先登录")
                    return ctx
                }
                ctx.state = {
                    userId: userResult.data.user_id,
                    userName: userResult.data.nick_name,
                    account: userResult.data.account,
                    companyId: userResult.data.company_id
                }
            } catch (error) {
                log.error(`WpsSidMiddleware throw error, msg: ${error.message}`, error)
                ctx.body = new Result(Result.FAIL_CODE, error.message ? error.message : "")
                return ctx
            }
            await next()
        }
        return mid
    }
}

export default new WpsSidMiddleware()
