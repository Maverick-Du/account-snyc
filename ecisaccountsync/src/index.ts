import './endpoints'
import './common/logger'
import docmini from './common/docmini'
import cams from './common/cams'
import sync from './modules/sync'
import increment_sync from './modules/increment_sync'
import config from "./common/config";
import WpsSidMiddleware from "./middleware/WpsSidMiddleware";
import AdminUserRoleMiddleware from './middleware/AdminUserRoleMiddleware'
import db from './modules/db/DbManager'
import schedule from './modules/schedule/ScheduleService'
import audit from './modules/audit'
import full_sync_statistic_analyse from './modules/full_sync_statistic_analyse/full_sync_analyse'
import {root, Server} from "./sdk/cognac/server";
import { log } from './sdk/cognac/common'

async function main(args: string[]) {
  try {
    const app = new Server()

    await db.init()
    // 云文档
    await docmini.init()
    // cams
    await cams.init()

    // 日志初始化
    await audit.init()

    // 初始化全量同步
    sync.init()
    // 初始化增量同步
    increment_sync.init()
    // 初始化全量统计分析
    full_sync_statistic_analyse.init()

    // 定时处理
    await schedule.init()
    app.init({body: {multipart: true}})
    app.use(WpsSidMiddleware.checkWpsSid())
    app.use(AdminUserRoleMiddleware.checkUserRolePermission())
    app.use(root.routes())
    app.start(config.port)
  } catch (err) {
    log.error(`server start error, msg: ${err.message}`, err)
  }
}

main(process.argv)
