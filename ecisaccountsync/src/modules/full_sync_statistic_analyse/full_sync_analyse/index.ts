import docmini from "../../../common/docmini"
import { WPS4Context } from "../../../sdk/common/wps4"
import DbManager from "../../db/DbManager"
import FullSyncAnalyseContext from "./context"
import { lockService } from '../../lock'
import { CompanyCfg } from '../../../sdk/account'
import { log } from "../../../sdk/cognac"

export default new(class {
  ctx: FullSyncAnalyseContext

  init() {
    this.ctx = new FullSyncAnalyseContext()
    this.ctx.init({
      ctx: docmini.ctx,
      db: DbManager.collectDb
    })
  }

  async start(taskId: string, cfg: CompanyCfg, lockId: number, lockKey: string) {
    try {
      await this.ctx.start(taskId, cfg)
    } catch (err) {
      err.msg = `full sync statistic analyse ${taskId} error. companyId: ${cfg.companyId}, msg: ${err.message}`
      log.error(err)
    } finally {
      log.i({info: `full sync statistic analyse ${taskId} end. companyId: ${cfg.companyId}`})
      if (lockId > 0) {
        await lockService.releaseLock(lockId, lockKey)
      }
    }
  }
})
