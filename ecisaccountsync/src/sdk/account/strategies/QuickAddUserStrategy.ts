/* eslint-disable eqeqeq */
import {log, Ticker} from '../../cognac/common';
import {
    LocalDeptUser, LocalMember,
    SyncStrategyType,
    WPSDepartment, WpsDeptAndLocalMember,
    WPSUser, WPSUserStatus
} from '../sync'
import config from "../../../common/config";
import {
  IQuickAddUserContext,
  IQuickAddUserResult,
  IQuickAddUserStrategy
} from "../sync/engine/strategies/QuickAddUserStrategy";
import fullSyncTaskService from "../../../modules/service/FullSyncTaskService";

export class QuickAddUserStrategy implements IQuickAddUserStrategy {
  name: string = SyncStrategyType.QuickAddUser

  async exec(ctx: IQuickAddUserContext): Promise<IQuickAddUserResult> {
    const { task, engine } = ctx

    log.i({
        info: `full sync ${task.taskId} quickAddUser companyId: ${task.cfg.thirdCompanyId} start`,
    })
    fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)

    const tick = new Ticker()

    // 1. 查询部门用户关系中间表所有数据
    for (const pId of task.cfg.platformIdList) {
        let startId = await engine.las.getDeptUerMinOrMaxId(task.originTaskId, task.cfg.thirdCompanyId, pId, "ASC")
        let endId = await engine.las.getDeptUerMinOrMaxId(task.originTaskId, task.cfg.thirdCompanyId, pId, "DESC")
        if (endId == 0) {
            break
        }
        let allLocalDeptUsers = await engine.las.pageQueryDeptUsers(task.originTaskId, task.cfg.thirdCompanyId, pId, startId, endId)
        log.i({
            info: `full sync ${task.taskId} quickAddUser pageQueryDeptUsers end, companyId: ${task.cfg.thirdCompanyId}, localDeptUsersLength: ${allLocalDeptUsers.length}`,
        })
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)

        // 2. 查询这些数据里面哪些部门已存在，在内存里面建立 thirdDid => WPSDept 缓存数据
        // did => WPSDepartment
        const existDeptMap = new Map<string, WPSDepartment>()
        const userDeptMap = new Map<string, LocalDeptUser>()
        let didSet = new Set<string>()
        let uidSet = new Set<string>()
        for (const localDeptUser of allLocalDeptUsers) {
            didSet.add(localDeptUser.did)
            uidSet.add(localDeptUser.uid)
            if (!userDeptMap.has(localDeptUser.uid) || localDeptUser.main == 1) {
                userDeptMap.set(localDeptUser.uid, localDeptUser)
            }
        }
        await this.groupOpt(Array.from(didSet), async (items)=>{
            let wpsDepts = await engine.was.queryDeptsByThirdUnionIds(task.cfg.companyId, pId, items)
            for (const wpsDept of wpsDepts) {
                existDeptMap.set(wpsDept.third_dept_id, wpsDept)
            }
        }, 100)
        // 因为云文档根部门没有三方ID, 但采集表可能存在根部门下的用户，需要特殊处理
        const wRoot = await engine.was.root(task.cfg.companyId)
        const lRoot = await engine.las.root(task.originTaskId, task.cfg.thirdCompanyId)
        existDeptMap.set(lRoot.did, wRoot)
        log.i({
            info: `full sync ${task.taskId} quickAddUser queryExistDepts end, companyId: ${task.cfg.thirdCompanyId}, existDeptMapSize: ${existDeptMap.size}`,
        })
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)

        // 3. 查询这些数据里面哪些用户不存在，建立 uid => thirdDid的map
        await this.groupOpt(Array.from(uidSet), async (items)=>{
            let wpsUsers = await engine.was.queryUsersByThirdUnionIds(task.cfg.companyId, pId, items)
            for (const wpsUser of wpsUsers) {
                userDeptMap.delete(wpsUser.third_union_id)
            }
        }, 100)
        // userDeptMap下剩下的都是用户不存在的
        log.i({
            info: `full sync ${task.taskId} quickAddUser queryExistUsers end, companyId: ${task.cfg.thirdCompanyId}, userDeptMapSize: ${userDeptMap.size}`,
        })
        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)

        // 4. 分批创建用户
        //   先分批基于uid读取tb_las_user表数据，异步提交创建用户请求
        let allAddLocalUsers: WpsDeptAndLocalMember[] = []
        await this.groupOpt(Array.from(userDeptMap.keys()), async (items)=>{
            // 首先查询tb_las_user表
            let localUsers = await engine.las.getUsersByUids(task.originTaskId, pId, items)
            if (localUsers.length <= 0) {
                return
            }
            for (const user of localUsers) {
                if (user.employment_status != WPSUserStatus.Active
                    && user.employment_status != WPSUserStatus.NotActive) {
                    continue
                }
                let lud = userDeptMap.get(user.uid)
                if (!lud) {
                    continue
                }
                let dept = existDeptMap.get(lud.did)
                if (!dept) {
                    continue
                }
                let member = user as LocalMember
                member.order = lud.order
                allAddLocalUsers.push({
                    dept: dept,
                    user: member
                } as WpsDeptAndLocalMember)
            }
        }, 200)
        log.i({ info: `full sync ${task.taskId} quickAddUser allAddLocalUsers end. allAddLocalUsersLength: ${allAddLocalUsers.length}` })

        fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)

        await this.groupOpt(allAddLocalUsers, async (items)=>{
            log.i({ info: `full sync ${task.taskId} quickAddUser addDeptUsers start. itemLength: ${items.length}` })
            const tick1 = new Ticker()
            await engine.sm.exec(SyncStrategyType.AddDepartmentMembers, {
                engine,
                task,
                deptUsers: items
            })
            log.i({ info: `full sync ${task.taskId} quickAddUser addDeptUsers end[${tick1.end()}]. itemLength: ${items.length}` })
        })

        log.i({
            info: `full sync ${task.taskId} quickAddUser addUserLength: ${
                allAddLocalUsers.length
            }, addUserErrorLength: ${task.statistics.user_error} success[${tick.end()}]`,
        })
    }

    return { code: 'ok' }
  }

  filter(wpsUsers: WPSUser[]): WPSUser[] {
    return wpsUsers.filter((wpsUser) => wpsUser.third_union_id)
  }

  // 分批操作
  async groupOpt<T>(
      data: T[],
      func: { (objectGroup: T[]): Promise<void> },
      groupSize: number = config.asyncSize
  ) {
    const groupList = this.averageList(data, groupSize)
    for (const objectGroup of groupList) {
      await func(objectGroup)
    }
  }

  averageList<T>(list: T[], groupSize: number = config.asyncSize): T[][] {
    const groupList: T[][] = []
    let start = 0
    let end = 0

    while (start < list.length) {
      end = start + groupSize
      if (end > list.length) {
        end = list.length
      }

      const objectGroup = list.slice(start, end)
      groupList.push(objectGroup)
      start = end
    }
    return groupList
  }
}
