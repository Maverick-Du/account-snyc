/* eslint-disable eqeqeq */

import {
  IBatchDeleteUserContext,
  IBatchDeleteUserResult,
  IBatchDeleteUserStrategy,
  SyncStrategyType,
} from '../../sync'
import {log, Ticker} from '../../../cognac/common';

export class BatchDeleteUserStrategy implements IBatchDeleteUserStrategy {
  name: string = SyncStrategyType.BatchDeleteUser

  async exec(ctx: IBatchDeleteUserContext): Promise<IBatchDeleteUserResult> {
    const { engine, users, task } = ctx
    const deleteUsers = users.filter(
      (user) => user.third_union_id && user.login_name !== 'wpsadmin'
    )
    if (deleteUsers.length > 0) {
      const companyId = deleteUsers[0].company_id
      const tick = new Ticker()
      await engine.was.deleteUsers(companyId, deleteUsers)
      log.debug({
        info: `full sync ${task.taskId} deleteUsers delUserIds: ${users.map(item => `${item.login_name}&${item.user_id}`).join(',')} [${tick.end()}]`,
      })
    }
    return { code: 'ok' }
  }
}
