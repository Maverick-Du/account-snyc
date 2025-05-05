
import { Middleware } from "koa";
import docmini from "../common/docmini";
import {Result} from "../common/type";
import { log } from "../sdk/cognac/common";

const PERMISSION_KEY = 'contacts.account_sync.account_sync'
const adminApiList = [
  '/api/manage/fullsync/task/cancel',
  '/api/manage/fullsync/task/detail',
  '/api/manage/fullsync/task/ignore',
  '/api/manage/fullsync/task/list',
  '/api/manage/fullsync/task/retry',
  '/api/manage/fullsync/schedule/setting',
  '/api/manage/fullsync/schedule',
  '/api/manage/fullsync/task/stop',
  '/api/manage/incrementsync/schedule/setting',
  '/api/manage/incrementsync/schedule',
  '/api/manage/incrementsync/task/detail',
  '/api/manage/incrementsync/task/list',
  '/api/manage/incrementsync/task/retry',
  '/api/manage/sync/endtime',
  '/api/manage/fullsync/detail/download',
  '/api/manage/fullsync/fail/download',
  '/api/manage/fullsync/scope/query',
  '/api/manage/fullsync/scope/save',
  '/api/manage/fullsync/task/continue',
  '/api/manage/fullsync/task/success',
  '/api/manage/fullsync/threshold/query',
  '/api/manage/fullsync/threshold/save',
  '/api/manage/fullsync/warn/download',
  '/api/manage/rollback/task/create',
  '/api/manage/rollback/task/processing',
  '/api/manage/rollback/task/list',
  '/api/manage/fullsync/analyse/start',
  '/api/manage/fullsync/analyse/status',
  '/api/manage/fullsync/analyse/stop',
  '/api/manage/fullsync/analyse/error/list',
  '/api/manage/fullsync/analyse/error/details',
  '/api/manage/fullsync/analyse/mid/list',
  '/api/manage/fullsync/task/analyse/detail',
]

class AdminUserRoleMiddleware {
  checkUserRolePermission(): Middleware {
    const mid: Middleware = async (ctx, next) => {
      try {
        log.i({url: ctx.url, state: ctx.state})
        // 验证是否是管理后台相关接口
        let isContain = false
        for (const api of adminApiList) {
          if (ctx.url.includes(api)) {
            isContain = true
            break
          }
        }
        if (!isContain) {
          await next()
          return
        }
        let userId = ctx.state.userId
        let companyId = ctx.state.companyId
        const permissionResult = await docmini.checkCurrentUserRolePermission(userId, companyId, [PERMISSION_KEY])
        log.i({ permissionResult: permissionResult})
        // 超级管理员，直接放行
        if (permissionResult.data.is_super_admin) {
          await next()
          return
        }
        if (!permissionResult.data || !permissionResult.data.items || permissionResult.data.items.length === 0 || !permissionResult.data.items[0].is_exists) {
          ctx.body = new Result(Result.NOT_ROLE_PERMISSION, '无权限调用')
          return
        }
      } catch (error) {
        log.error(`AdminUserRoleMiddleware throw error, msg: ${error.message}`, error)
        ctx.body = new Result(Result.FAIL_CODE, error.message ? error.message : "")
        return ctx
      }
      await next()
    }
    return mid
  }
}

export default new AdminUserRoleMiddleware()
