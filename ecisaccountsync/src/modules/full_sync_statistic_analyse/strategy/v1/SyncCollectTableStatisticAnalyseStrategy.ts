import { log, Ticker } from "../../../../sdk/cognac";
import { CheckTypeEnum, LocalDepartment, LocalDeptUser } from "../../../../sdk/account/sync/las/types";
import { FullSyncMidAnalyseRecord } from "../../../db/tables/FullSyncMidAnalyseRecord";
import { SyncAnalyseStrategyType } from "../type";
import { ICollectTableStatisticAnalyseStrategy, ICollectTableStatisticAnalyseContext, ICollectTableStatisticAnalyseResult } from "./type";
import { UserSchema } from '../../../../sdk/account';

export class SyncCollectTableStatisticAnalyseStrategy implements ICollectTableStatisticAnalyseStrategy {
  name: string = SyncAnalyseStrategyType.FullSyncCollectTableStatisticAnalyse
  async exec(ctx: ICollectTableStatisticAnalyseContext): Promise<ICollectTableStatisticAnalyseResult> {
    const { engine, analyseTask } = ctx
    // 判断是否需要停止统计分析
    engine.las.checkStatisticAnalyseIdNeedStop(analyseTask.taskId, analyseTask.cfg.companyId)


    // 判断记录是否已经存在
    const record = await engine.las.getFullSyncMidAnalyseRecord(analyseTask.taskId, analyseTask.cfg.companyId)
    if (!!record) {
      return { code: 'ok' }
    }

    // 获取全量同步记录表中的数据
    let recordInfo: Partial<FullSyncMidAnalyseRecord> = {
      task_id: analyseTask.taskId,
      company_id: analyseTask.cfg.companyId,
      total_user: 0,
      total_dept: 0,
      total_dept_user: 0,
      sync_user: 0,
      sync_dept: 0,
      drift_user: 0,
      drift_dept: 0,
      drift_dept_user: 0,
      select_all: 0,
      select_total_user: 0,
      select_total_dept: 0
    }

    const ticker = new Ticker()

    // 可同步部门数
    let syncDeptSet: Set<string> = new Set()
    // 游离部门数
    let driftDeptSet: Set<string> = new Set()
    // 可同步用户数
    let syncUserSet: Set<string> = new Set()
    // 游离部门下用户数
    let driftDeptUserSet: Set<string> = new Set()
    // 游离用户数
    let driftUserSet: Set<string> = new Set()

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} collectTableStatisticAnalyse start`,
    })

    // 用户总数
    const minUserId = await engine.las.getUserMinOrMaxIdByMidTable(analyseTask.originTaskId, analyseTask.cfg.companyId, 'ASC');
    const maxUserId = await engine.las.getUserMinOrMaxIdByMidTable(analyseTask.originTaskId, analyseTask.cfg.companyId, 'DESC');

    const allUserData = await engine.las.pageQueryUsersByMidTable(analyseTask.originTaskId, analyseTask.cfg.companyId, minUserId, maxUserId);
    recordInfo.total_user = allUserData.length

    const allUserDataSet = new Set<string>()
    for (const item of allUserData) {
      allUserDataSet.add(`${item.uid},${item.platform_id}`)
    }


    // 勾选用户总数
    const selectUserData = allUserData.filter((deptUser: UserSchema) => {
      return deptUser.check_type === CheckTypeEnum.ENABLE
    })
    recordInfo.select_total_user = selectUserData.length

    // 部门总数
    const minDeptId = await engine.las.getDeptMinOrMaxIdByMidTable(analyseTask.originTaskId, analyseTask.cfg.companyId, 'ASC');
    const maxDeptId = await engine.las.getDeptMinOrMaxIdByMidTable(analyseTask.originTaskId, analyseTask.cfg.companyId, 'DESC');

    const allDeptData = await engine.las.pageQueryDeptsByMidTable(analyseTask.originTaskId, analyseTask.cfg.companyId, minDeptId, maxDeptId);
    recordInfo.total_dept = allDeptData.length

    // 勾选部门总数
    const selectDeptData = allDeptData.filter((dept: LocalDepartment) => {
      return dept.check_type === CheckTypeEnum.ENABLE
    })

    recordInfo.select_total_dept = selectDeptData.length

    // 部门用户总数
    const minDeptUserId = await engine.las.getDeptUserMinOrMaxIdByMidTable(analyseTask.originTaskId, analyseTask.cfg.companyId, 'ASC');
    const maxDeptUserId = await engine.las.getDeptUserMinOrMaxIdByMidTable(analyseTask.originTaskId, analyseTask.cfg.companyId, 'DESC');

    const allDeptUserData = await engine.las.pageQueryDeptUsersByMidTable(analyseTask.originTaskId, analyseTask.cfg.companyId, minDeptUserId, maxDeptUserId);
    recordInfo.total_dept_user = allDeptUserData.length

    // 可同步部门数
    syncDeptSet = await this.recursionGetSyncDeptInfo(["-1,empty"], allDeptData);
    recordInfo.sync_dept = syncDeptSet.size;


    // 游离部门数
    const driftDeptList = allDeptData.filter((dept: LocalDepartment) => {
      return !syncDeptSet.has(`${dept.did},${dept.platform_id}`)
    }).map((dept: LocalDepartment) => {
      return `${dept.did},${dept.platform_id}`
    });

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} recursionGetSyncDeptInfo end, driftDeptListLength: ${driftDeptList.length}, driftDeptDetail: ${driftDeptList.join("，")}`,
    })

    driftDeptSet = new Set(driftDeptList)
    recordInfo.drift_dept = driftDeptSet.size

    // 可同步用户数
    const syncUserList = allDeptUserData.filter((deptUser: LocalDeptUser) => {
      if (syncDeptSet.has(`${deptUser.did},${deptUser.platform_id}`) && allUserDataSet.has(`${deptUser.uid},${deptUser.platform_id}`)) {
        allUserDataSet.delete(`${deptUser.uid},${deptUser.platform_id}`)
        return true
      }
      return false
    }).map((deptUser: LocalDeptUser) => {
      return `${deptUser.uid},${deptUser.platform_id}`
    })

    syncUserSet = new Set(syncUserList)
    recordInfo.sync_user = syncUserSet.size

    // 游离部门下总用户数
    const driftDeptUserList = allDeptUserData.filter((deptUser: LocalDeptUser) => {
      if (driftDeptSet.has(`${deptUser.did},${deptUser.platform_id}`) && !syncUserSet.has(`${deptUser.uid},${deptUser.platform_id}`) && allUserDataSet.has(`${deptUser.uid},${deptUser.platform_id}`)) {
        allUserDataSet.delete(`${deptUser.uid},${deptUser.platform_id}`)
        return true
      }
      return false
    }).map((deptUser: LocalDeptUser) => {
      return `${deptUser.uid},${deptUser.platform_id}`
    });

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} recursionGetSyncDeptInfo end, driftDeptUserListLength: ${driftDeptUserList.length}, driftDeptUserDetail: ${driftDeptUserList.join("，")}`,
    })

    driftDeptUserSet = new Set(driftDeptUserList)
    recordInfo.drift_dept_user = driftDeptUserSet.size

    // 游离用户数
    // const driftUserList = allDeptUserData.filter((deptUser: LocalDeptUser) => {
    //   return !syncDeptSet.has(`${deptUser.did},${deptUser.platform_id}`) && !driftDeptSet.has(`${deptUser.did},${deptUser.platform_id}`)
    // }).map((deptUser: LocalDeptUser) => {
    //   return `${deptUser.uid},${deptUser.platform_id}`
    // });

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} recursionGetSyncDeptInfo end, driftUserListLength: ${allUserDataSet.size}, driftUserDetail: ${Array.from(allUserDataSet).join("，")}`,
    })

    driftUserSet = allUserDataSet
    recordInfo.drift_user = driftUserSet.size

    await engine.las.addFullSyncMidAnalyseRecord(recordInfo)

    log.i({
      info: `full sync statistic analyse ${analyseTask.taskId} collectTableStatisticAnalyse success[${ticker.end()}]`,
    })
    return { code: 'ok' }
  }

  async recursionGetSyncDeptInfo(deptList: string[], allDeptData: LocalDepartment[]): Promise<Set<string>> {
    const queue = [...deptList]; // 初始化队列
    const visited = new Set<string>(deptList); // 用来存储已处理的部门

    let result: Set<string> = new Set()

    while (queue.length > 0) {
      // 获取当前部门列表的 didList
      const didList = allDeptData.filter((dept: LocalDepartment) => {
        const pid = dept.pid;
        const platformId = dept.platform_id;
        if (queue.includes("-1,empty")) {
          return pid === "-1";
        } else {
          return queue.includes(`${pid},${platformId}`);
        }
      }).map((dept: LocalDepartment) => {
        return `${dept.did},${dept.platform_id}`;
      });

      // 更新同步部门集合
      if (didList.length !== 0) {
        result = new Set([...Array.from(result), ...didList]);
      }

      queue.length = 0; // 清空队列，准备放入新的待处理部门

      // 将未处理的部门加入队列，并标记为已处理
      didList.forEach(did => {
        if (!visited.has(did)) {
          visited.add(did);
          queue.push(did);
        }
      });
    }

    return result
  }
}
