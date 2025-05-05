/* eslint-disable eqeqeq */
import {log, Ticker} from '../../../cognac/common';
import {LocalUser, SyncStrategyType, WPSUser} from '../../sync'
import {
  IUpdateUserLeaderContext, IUpdateUserLeaderResult,
  IUpdateUserLeaderStrategy
} from '../../sync/engine/strategies/UpdateUserLeaderStrategy'
import {UpdateCompanyUser} from '../../../v7/org/dev/v1'
import fullSyncTaskService from '../../../../modules/service/FullSyncTaskService'
import fullSyncRecordService from "../../../../modules/service/FullSyncRecordService";
import {FullSyncUpdateType, RecordStatus} from "../../../../modules/db/types";

export class UpdateUserLeaderStrategy implements IUpdateUserLeaderStrategy {
  name: string = SyncStrategyType.UpdateUserLeader

  async exec(ctx: IUpdateUserLeaderContext): Promise<IUpdateUserLeaderResult> {
    const { task, engine } = ctx

    log.debug({
      info: `full sync ${task.taskId} updateUserLeader companyId: ${task.cfg.thirdCompanyId} start`,
    })
    const tick = new Ticker()

    const allLeaderUsers: LocalUser[] = []

    for (const platformId of task.cfg.platformIdList) {
      // 查询所有用户
      const localUsers = await engine.las.getAllUsersListNoCustom(task.originTaskId, task.cfg.thirdCompanyId, platformId);
      // 过滤用户不为空的
      let leaderUsers = localUsers.filter((user) => user.leader)

      for (const leaderUser of leaderUsers) {
        allLeaderUsers.push(leaderUser)
      }
    }
    log.i({
      info: `full sync ${task.taskId} updateUserLeader.getLocalUsers leaderUsersLength: ${allLeaderUsers.length} [${tick.end()}]`,
    })

    for (const user of allLeaderUsers) {
      fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
      try {
        let leaderUser = await engine.was.queryUsersByThirdUnionId(task.cfg.companyId, user.platform_id, user.leader)
        if (!leaderUser) {
          throw new Error(`用户leader不存在，uid: ${user.uid}, account: ${user.name}, leader: ${user.leader}`)
        }
        let exist = await engine.was.queryUsersByThirdUnionId(task.cfg.companyId, user.platform_id, user.uid)
        if (!exist) {
          throw new Error(`用户不存在，uid: ${user.uid}, account: ${user.name}`)
        }
        if (exist.leader != leaderUser.user_id) {
          let update = {
            leader: leaderUser.user_id
          } as UpdateCompanyUser

          await engine.was.updateUser(task.cfg.companyId, exist.user_id, update)
          task.statistics.user_leader_update++
          log.i({ info: `full sync ${task.taskId} updateUserLeader thirdUserId: ${user.uid}, account: ${user.name}, leader: ${user.leader} end` })
        }
      } catch (e) {
        e.msg = `full sync ${task.taskId} updateUserLeader throw error. thirdUserId: ${user.uid}, account: ${user.name}, leader: ${user.leader}`
        log.i(e)
        task.statistics.user_leader_update_error += 1
        task.statistics.user_error += 1
        let u = {
          company_id: task.cfg.companyId,
          login_name: user.name,
          nick_name: user.nick_name,
          third_platform_id: user.platform_id,
          third_union_id: user.uid
        } as WPSUser
        await fullSyncRecordService.addUserRecord(task.taskId, u, FullSyncUpdateType.UserUpdate, RecordStatus.FAIL, e)
      }
    }
    log.i({
      info: `full sync ${task.taskId} updateUserLeader companyId: ${task.cfg.thirdCompanyId} end. leaderUsersLength: ${
          allLeaderUsers.length
      } [${tick.end()}]`,
    })

    return { code: 'ok' }
  }

}
