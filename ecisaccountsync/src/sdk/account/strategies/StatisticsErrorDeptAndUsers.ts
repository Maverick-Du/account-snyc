/* eslint-disable eqeqeq */
import {log, Ticker} from '../../cognac/common';
import {
  CompanyCfg,
  SyncEngine,
  SyncStrategyType,
} from '../sync'
import config from "../../../common/config";
import {
  IQuickAddUserContext,
  IQuickAddUserResult,
  IQuickAddUserStrategy
} from "../sync/engine/strategies/QuickAddUserStrategy";
import lasAdminService from "../../../modules/service/LasAdminService";
import {FullSyncUpdateType, RecordStatus} from "../../../modules/db/types";
import fullSyncTaskService from "../../../modules/service/FullSyncTaskService";

export class StatisticsErrorDeptAndUsers implements IQuickAddUserStrategy {
  name: string = SyncStrategyType.StatisticsErrorData

  async exec(ctx: IQuickAddUserContext): Promise<IQuickAddUserResult> {
    const { task, engine } = ctx
    let taskId = config.statisticsTaskId
    let originTaskId = fullSyncTaskService.getOriginTaskId(taskId)
    log.i({
      info: `full sync ${taskId} statisticsErrorData taskId: ${taskId} start`,
    })
    const tick = new Ticker()

    //1. 基于 tb_full_sync_dept_record表记录，找到创建失败的所有部门
    let deptAddError = await lasAdminService.queryDeptRecordsByStatusAndType(taskId, RecordStatus.FAIL, FullSyncUpdateType.DeptAdd)
    log.i({
      info: `full sync ${taskId} statisticsErrorData.queryDeptRecordsByStatusAndType end deptAddErrorLength: ${deptAddError.length}`,
    })

    let errorDidSet = new Set<string>()
    let childDidSet = new Set<string>()
    //2. 查询这些部门下的所有子部门，进行统计，就是所有创建失败的部门数
    for (const record of deptAddError) {
      errorDidSet.add(record.did)
      let childDids = await this.recursionAllChildDepts(engine, originTaskId, task.cfg, record.did)
      childDids.forEach(x => childDidSet.add(x))
      log.i({
        info: `full sync ${taskId} statisticsErrorData recursionChildDepts end, did: ${record.did}, name: ${record.name}, childDidsLength: ${childDids.length}`,
      })
    }
    const allErrorDids = new Set([...errorDidSet, ...childDidSet]);

    log.i({
      info: `full sync ${taskId} statisticsErrorData recursionAllChildDepts end, errorDidSetLength: ${Array.from(errorDidSet).length}, childDidSetLength: ${Array.from(childDidSet).length}, allErrorDidsLength: ${Array.from(allErrorDids).length}`,
    })

    //3. 找这些部门下的成员，去重，粗略得到所有创建失败的用户数，分页查询云文档接口判断哪些用户已创建，总数 - 已创建的 = 未创建的
    // 查询部门用户关系中间表所有数据
    let startId = await engine.las.getDeptUerMinOrMaxId(originTaskId, task.cfg.thirdCompanyId, task.cfg.platformIdList[0], "ASC")
    let endId = await engine.las.getDeptUerMinOrMaxId(originTaskId, task.cfg.thirdCompanyId, task.cfg.platformIdList[0], "DESC")
    if (endId == 0) {
      return { code: 'ok' }
    }
    let allLocalDeptUsers = await engine.las.pageQueryDeptUsers(originTaskId, task.cfg.thirdCompanyId, task.cfg.platformIdList[0], startId, endId)
    log.i({
      info: `full sync ${taskId} statisticsErrorData allLocalDeptUsers end, allLocalDeptUsersLength: ${allLocalDeptUsers.length}`,
    })

    // 找到在这些错误部门下的去重的用户uid
    let errorUids = new Set<string>()
    for (const localDeptUser of allLocalDeptUsers) {
      if (allErrorDids.has(localDeptUser.did)) {
        errorUids.add(localDeptUser.uid)
      }
    }
    log.i({
      info: `full sync ${taskId} statisticsErrorData getAllDeptUsers end, errorUids: ${Array.from(errorUids).length}`,
    })

    // 查询云文档，确认这些用户中哪些已创建
    let existUids: string[] = []
    await this.groupOpt(Array.from(errorUids), async (items)=>{
      let wpsUsers = await engine.was.queryUsersByThirdUnionIds(task.cfg.companyId, task.cfg.platformIdList[0], items)
      for (const wpsUser of wpsUsers) {
        existUids.push(wpsUser.third_union_id)
      }
    }, 100)
    log.i({
      info: `full sync ${taskId} statisticsErrorData queryExistWpsUser end, existUids: ${existUids.length}, remainLength: ${Array.from(errorUids).length - existUids.length}`,
    })

    existUids.forEach(x => errorUids.delete(x))

    await this.groupOpt(Array.from(allErrorDids), async (items)=>{
      log.i({
        info: `full sync ${taskId} statisticsErrorData notCreateDids: ${items.map(item => `${item}`).join(',')}`,
      })
    }, 100)

    await this.groupOpt(Array.from(errorUids), async (items)=>{
      log.i({
        info: `full sync ${taskId} statisticsErrorData notCreateUids: ${items.map(item => `${item}`).join(',')}`,
      })
    }, 100)


    log.i({
      info: `full sync ${taskId} statisticsErrorData success[${tick.end()}]`,
    })
    return { code: 'ok' }
  }

  async recursionAllChildDepts(engine: SyncEngine, taskId: string, cfg: CompanyCfg, did: string) {
    const dids: string[] = []
    const stack = [did]
    while (stack.length > 0) {
      const deptDid = stack.pop()
      if (!deptDid) continue

      let childs = await engine.las.listDepartments(taskId, cfg.thirdCompanyId, cfg.platformIdList[0], deptDid)
      for (const d of childs) {
        dids.push(d.did)
        stack.push(d.did)
      }
    }
    return dids
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
