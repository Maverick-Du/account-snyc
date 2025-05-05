import { log, Ticker } from "../../../../sdk/cognac";
import { SyncAnalyseStrategyType } from "../type";
import { IDeptAddErrorStatisticAnalyseStrategy, IDeptAddErrorStatisticAnalyseContext, IDeptAddErrorStatisticAnalyseResult, IDeptAddErrorExtra } from "./type";
import { FullSyncUpdateType, RecordStatus, StatisticAnalyseErrType, StatisticAnalyseOperateType, StatisticAnalyseTbType } from '../../../db/types';
import { SyncStatisticAnalyseEngine } from '../SyncStatisticAnalyseEngine';
import config from '../../../../common/config';

export class SyncDeptAddErrorStatisticAnalyseStrategy implements IDeptAddErrorStatisticAnalyseStrategy {
  name: string = SyncAnalyseStrategyType.FullSyncDeptAddErrorStatisticAnalyse
  async exec(ctx: IDeptAddErrorStatisticAnalyseContext): Promise<IDeptAddErrorStatisticAnalyseResult> {
    const { engine, analyseTask } = ctx
    // 判断是否需要停止统计分析
    engine.las.checkStatisticAnalyseIdNeedStop(analyseTask.taskId, analyseTask.cfg.companyId)

    // 判断数据是否已经存在
    let recordKey = `${StatisticAnalyseTbType.Dept}_${StatisticAnalyseOperateType.DeptAdd}_${StatisticAnalyseErrType.DeptAddErrorCount}`
    if (analyseTask.hasRecord(recordKey)) {
      return { code: 'ok' }
    }

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} deptAddError start`,
    })
    const ticker = new Ticker()
    let totalDeptAddError: number = 0
    let totalUserUnAdd: number = 0
    let deptAddErrCount: number = 0
    let childDeptAddErrCount: number = 0
    // 1. 基于 tb_full_sync_dept_record表记录，找到创建失败的所有部门
    let deptAddErrors = await engine.las.getAnalyseDeptRecordsByStatusAndType(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.DeptAdd)
    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} getAnalyseRecordsByStatusAndType end deptAddErrorLength: ${deptAddErrors.length}`,
    })

    let errorDeptSet = new Set<string>()
    let childDeptSet = new Set<string>()
    // 2. 部门记录表中数据存在重复情况，在此需要进行去重处理
    for (const record of deptAddErrors) {
      let didStr = `${record.did}${config.splitSymbol}${record.platform_id}`
      errorDeptSet.add(didStr)
    }
    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} deptAddError distinct errorDeptSetLength: ${Array.from(errorDeptSet).length}`,
    })
    // 3. 查询这些部门下的所有子部门，进行统计，就是所有创建失败的部门数
    for (const didStr of errorDeptSet) {
      // 判断是否需要停止统计分析
      engine.las.checkStatisticAnalyseIdNeedStop(analyseTask.taskId, analyseTask.cfg.companyId)
      let childDids = await this.recursionAllChildDepts(engine, analyseTask.originTaskId, analyseTask.cfg.thirdCompanyId, didStr)
      childDids.forEach(x => childDeptSet.add(x))
      log.i({
        info: `full sync statistic analyse ${analyseTask.taskId} recursionChildDepts end, did: ${didStr}, childDidsLength: ${childDids.length}`,
      })
    }
    const allDeptAddErrors = new Set([...errorDeptSet, ...childDeptSet])
    totalDeptAddError = allDeptAddErrors.size
    deptAddErrCount = errorDeptSet.size
    childDeptAddErrCount = childDeptSet.size

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} recursionAllChildDepts end, errorDeptSetLength: ${Array.from(errorDeptSet).length}, childDeptSetLength: ${Array.from(childDeptSet).length}, allDeptAddErrorsLength: ${Array.from(allDeptAddErrors).length}`,
    })
    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} recursionAllChildDepts end, allErrorDeptAddDetail: ${Array.from(allDeptAddErrors).join(",")}`,
    })

    // 找到错误部门下的去重的用户uid
    for (const platformId of analyseTask.cfg.platformIdList) {
      // 3. 找这些部门下的成员，去重，粗略得到所有创建失败的用户数，分页查询云文档接口判断哪些用户已创建，总数 - 已创建的 = 未创建的
      let startId = await engine.las.getDeptUserMinOrMaxId(analyseTask.originTaskId, analyseTask.cfg.thirdCompanyId, platformId, "ASC")
      let endId = await engine.las.getDeptUserMinOrMaxId(analyseTask.originTaskId, analyseTask.cfg.thirdCompanyId, platformId, "DESC")
      if (endId <= 0) {
        continue
      }
      let allLocalDeptUsers = await engine.las.pageQueryDeptUsers(analyseTask.originTaskId, analyseTask.cfg.thirdCompanyId, platformId, startId, endId)
      let errrorUids = new Set<string>()
      for (const deptUser of allLocalDeptUsers) {
        let deptDidStr = `${deptUser.did}${config.splitSymbol}${deptUser.platform_id}`
        if (allDeptAddErrors.has(deptDidStr)) {
          errrorUids.add(deptUser.uid)
        }
      }

      let existUids: string[] = []
      await this.groupOpt(Array.from(errrorUids), async (items) => {
        let wpsUsers = await engine.was.queryUsersByThirdUnionIds(analyseTask.cfg.companyId, platformId, items)
        for (const wpsUser of wpsUsers) {
          existUids.push(wpsUser.third_union_id)
        }
      }, 100)
      existUids.forEach(uid => errrorUids.delete(uid))
      totalUserUnAdd += errrorUids.size
      log.i({
        info: `full sync statistic analyse ${analyseTask.taskId} queryExistWpsUser end, platformId: ${platformId}, userUnAddLength: ${errrorUids.size}, userUnAddDetail: ${Array.from(errrorUids).join(",")}`,
      })
    }
    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} queryExistWpsUser end, totalDetpAddError: ${totalDeptAddError}, totalUserUnAdd: ${totalUserUnAdd}`,
    })
    // let updateErrCount = await engine.las.getFullSyncDeptRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.DeptUpdate)
    // let deleteErrCount = await engine.las.getFullSyncDeptRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.DeptDel)
    // let moveErrCount = await engine.las.getFullSyncDeptRecordListCount(analyseTask.taskId, RecordStatus.FAIL, FullSyncUpdateType.DeptMove)
    // log.i({
    //   info: `full sync statistic analyse ${analyseTask.taskId} getFullSyncDeptRecordListCount end, updateErrCount: ${updateErrCount}, deleteErrCount: ${deleteErrCount}, moveErrCount: ${moveErrCount}`,
    // })
    const extra: IDeptAddErrorExtra = {
      totalDeptAddError,
      totalUserUnAdd,
      deptAddErrCount,
      childDeptAddErrCount,
      // updateErrCount,
      // deleteErrCount,
      // moveErrCount
    }
    let extraStr = JSON.stringify(extra)
    await engine.las.addFullSyncErrAnalyseRecord({
      task_id: analyseTask.taskId,
      company_id: analyseTask.cfg.companyId,
      sync_tb_type: StatisticAnalyseTbType.Dept,
      operate_type: StatisticAnalyseOperateType.DeptAdd,
      err_type: StatisticAnalyseErrType.DeptAddErrorCount,
      extra: extraStr
    })

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} deptAddError success[${ticker.end()}]`,
    })
    return { code: 'ok' }
  }

  async recursionAllChildDepts(engine: SyncStatisticAnalyseEngine, taskId: string, thirdCompanyId: string, didStr: string) {
    const dids: string[] = []
    const stack = [didStr]
    while (stack.length > 0) {
      const didString = stack.pop()
      if (!didString) {
        continue
      }
      const [deptDid, platformId] = didString.split(config.splitSymbol)
      let childs = await engine.las.getListDepartments(taskId, thirdCompanyId, platformId, deptDid)
      for (const d of childs) {
        dids.push(`${d.did}${config.splitSymbol}${d.platform_id}`)
        stack.push(`${d.did}${config.splitSymbol}${d.platform_id}`)
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
