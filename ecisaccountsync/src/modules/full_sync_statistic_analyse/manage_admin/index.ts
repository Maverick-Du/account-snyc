import { FullSyncMidAnalyseRecord } from "../../db/tables/FullSyncMidAnalyseRecord"
import { AnalyseListOvs, FullSyncStatisticAnalyseStatus, FullSyncStatus, RecordStatus, StatisticAnalyseErrType, StatisticAnalyseOperateType, StatisticAnalyseTbType } from "../../db/types"
import { fullSyncStatisticAnalyseSrv, FullSyncStatisticAnalyseSrv } from "../../service/FullSyncStatisticAnalyseSrv"
import { IAnalyseErrorDetailReqParams, IFullSyncTaskAnalyseDetail } from "./type"
import { lockService } from "../../lock/"
import { LockKey } from "../../lock/LockService"
import fullSyncStatisticAnalyse from "../full_sync_analyse"
import { AnalyseCommonErrName } from "../strategy/type"
import { CompanyCfg } from "../../../sdk/account"
import { IDeptAddErrorExtra, IDeptUserAddErrorExtra, IUserAddErrorExtra } from "../strategy/v1/type"
import fullSyncTaskService from '../../../modules/service/FullSyncTaskService'
import { log } from "../../../sdk/cognac"


class StatisticAnalyse {
  private statisticAnalyseSrv: FullSyncStatisticAnalyseSrv = fullSyncStatisticAnalyseSrv
  private lockService = lockService

  /**
   * @description 统计分析开始
   * @param taskId string
   * @param companyId string
   * @returns string
   */
  async startAnalyse(taskId: string, cfg: CompanyCfg, operator: string) {
     // 判断是否存在全量同步任务处理告警状态
     let taskInfo = await fullSyncTaskService.getTask(taskId, cfg.companyId)
     if (!taskInfo) {
      // 任务不存在，无法进行统计分析
      return {
        is_analyse: false,
        stat: 130
      }
     }
     if (taskInfo.status === FullSyncStatus.SYNC_DEL_WARN || taskInfo.status === FullSyncStatus.SYNC_SCOPE_WARN) {
      // 任务处于告警状态，无法进行统计分析
      return {
        is_analyse: false,
        stat: 140
      }
     }
     if (taskInfo.status === FullSyncStatus.TO_SYNC || taskInfo.status === FullSyncStatus.SYNC_ING) {
      // 等待当前任务执行完成
      return {
        is_analyse: false,
        stat: 150
      }
     }
     if (taskInfo.status ===FullSyncStatus.SYNC_CANCEL) {
      // 任务已取消，无需进行统计分析
      return {
        is_analyse: false,
        stat: 160
      }
     }
    // 判断是否存在分析记录，如果存在且状态为分析中、分析成功、分析终止中，则不可以进行分析
    let record = await this.statisticAnalyseSrv.getFullSyncTaskAnalyseRecord(cfg.companyId, taskId)
    if (record && (record.status === FullSyncStatisticAnalyseStatus.ANALYSE_ING || record.status === FullSyncStatisticAnalyseStatus.ANALYSE_SUCCESS || record.status === FullSyncStatisticAnalyseStatus.ANALYSE_STOP_ING)) {
      return {
        is_analyse: false,
        stat: record.status
      }
    }
    // 判断是否有锁，没有锁情况下可进行统计分析
    // 添加统计分析表status状态为分析中状态
    // 判断全量同步任务是否执行中
    let fullSyncLockKey = `${LockKey.BATCH_SYNC}_${cfg.companyId}`
    let desc = `${fullSyncLockKey}_FULL_SYNC_${taskId}`
    const syncLockInfo = await lockService.getLock(fullSyncLockKey)
    if (syncLockInfo && syncLockInfo.desc === desc) {
      // 存在加锁全量同步任务，统计分析任务无法执行
      return {
        is_analyse: false,
        stat: 110
      }
    }
    let lockId = 0
    let lockKey = `${LockKey.SYNC_STATISTIC_ANALYSE}_${cfg.companyId}`
    const analyseLockInfo = await lockService.getLock(lockKey)
    if (analyseLockInfo) {
      // 存在其他统计分析任务，统计分析任务无法执行
      return {
        is_analyse: false,
        stat: 120
      }
    }
    lockId = await lockService.tryLock(lockKey, `${lockKey}_ANALYSE_${taskId}`)
    if (lockId <= 0) {
      log.i({ info: `full sync statistic analyse ${taskId} exit. reason: not get lock` })
      return {
        is_analyse: false,
        stat: 500
      }
    }
    if (!record) {
      // 统计分析任务表状态置为执行中状态
      await this.statisticAnalyseSrv.addFullSyncTaskAnalyseRecord({
        task_id: taskId,
        company_id: cfg.companyId,
        status: FullSyncStatisticAnalyseStatus.ANALYSE_ING,
        operator: operator
      })
    } else {
      await this.statisticAnalyseSrv.updateFullSyncTaskAnalyseRecord(cfg.companyId, taskId, FullSyncStatisticAnalyseStatus.ANALYSE_ING)
    }
    // 统计分析任务开始执行（异步执行）
    fullSyncStatisticAnalyse.start(taskId, cfg, lockId, lockKey)
    log.i({ info: `full sync statistic analyse ${taskId} start... companyId: ${cfg.companyId}` })
    return {
      is_analyse: true
    }
  }

  async queryAnalyseStatus(taskId: string, companyId: string) {
    // 查询分析表status
    // 判断taskId是否存在
    let taskInfo = await this.statisticAnalyseSrv.getFullSyncTaskByTaskId(taskId, companyId)
    if (!taskInfo) {
      throw new Error('full sync task not found')
    }
    let record = await this.statisticAnalyseSrv.getFullSyncTaskAnalyseRecord(companyId, taskId)
    if (!record) {
      return {
        status: FullSyncStatisticAnalyseStatus.ANALYSE_DEFAULT
      }
    }
    if (record.status === FullSyncStatisticAnalyseStatus.ANALYSE_ING || record.status === FullSyncStatisticAnalyseStatus.ANALYSE_STOP_ING) {
      // 判断是否是程序强行终止情况
      let lockKey = `${LockKey.SYNC_STATISTIC_ANALYSE}_${companyId}`
      const analyseLockInfo = await lockService.getLock(lockKey)
      // 锁不存在，说明是程序强行终止
      if (!analyseLockInfo) {
        // 更新该任务为失败状态
        await this.statisticAnalyseSrv.updateFullSyncTaskAnalyseRecord(companyId, taskId, FullSyncStatisticAnalyseStatus.ANALYSE_FAIL, '程序终止')
        return {
          status: FullSyncStatisticAnalyseStatus.ANALYSE_FAIL,
          err_msg: '程序终止'
        }
      }
    }
    return {
      status: record.status,
      err_msg: record?.err_msg || ""
    }
  }

  /**
   * @description 统计分析停止
   * @param company_id string
   * @param task_id string
   * @returns string
   */
  async stopStatisticAnalyse(taskId: string, companyId: string) {
    // 查询分析表status，判断分析是否为分析中状态
    // 更新统计分析表status状态为停止中状态
    // 分析任务执行时需要注意检查status状态，如果是停止状态则停止任务，且释放锁
    let record = await this.statisticAnalyseSrv.getFullSyncTaskAnalyseRecord(companyId, taskId)
    if (!record) {
      throw new Error('statistic analyse not found')
    }
    if (record.status !== FullSyncStatisticAnalyseStatus.ANALYSE_ING) {
      throw new Error('statistic analyse status is not analyse_ing')
    }
    await this.statisticAnalyseSrv.updateFullSyncTaskAnalyseRecord(companyId, taskId, FullSyncStatisticAnalyseStatus.ANALYSE_STOP_ING)
    this.statisticAnalyseSrv.stopStisticAnalyse({
      companyId,
      taskId,
      name: AnalyseCommonErrName.AnalyseStop,
      message: `full sync statistic analyse ${taskId} stop`
    })
  }

  /**
   * @description 查询中间表统计分析信息
   * @param taskId string
   * @param companyId string
   * @returns FullSyncMidAnalyseRecord
   */
  async QueryMidTbAnalyseInfo(taskId: string, companyId: string): Promise<FullSyncMidAnalyseRecord> {
    // 获取分析统计表信息，通过status判断分析是否完成
    // 如果分析未完成，返回空值
    // 如果分析完成，返回分析结果
    let record = await this.statisticAnalyseSrv.getFullSyncTaskAnalyseRecord(companyId, taskId)
    if (!record || record.status !== FullSyncStatisticAnalyseStatus.ANALYSE_SUCCESS) {
      return null
    }
    return this.statisticAnalyseSrv.getFullSyncMidAnalyseRecord(companyId, taskId)
  }

  /**
   * @description 全量同步任务完成后同步详情查询
   * @param taskId string
   * @param companyId string
   * @returns IFullSyncTaskAnalyseDetail
   */
  async queryFullSyncTaskDetail(taskId: string, companyId: string): Promise<IFullSyncTaskAnalyseDetail> {
    // 查询分析表status，判断分析是否为分析成功状态
    // 如果分析成功，返回分析结果
    // 如果分析未完成，返回空值
    let record = await this.statisticAnalyseSrv.getFullSyncTaskAnalyseRecord(companyId, taskId)
    if (!record || record.status !== FullSyncStatisticAnalyseStatus.ANALYSE_SUCCESS) {
      return null
    }
    let recordInfo = await this.statisticAnalyseSrv.getFullSyncTaskStatistics(companyId, taskId)
    let midRecordInfo = await this.statisticAnalyseSrv.getFullSyncMidAnalyseRecord(companyId, taskId)

    let respInfo: IFullSyncTaskAnalyseDetail = {
      user: {
        total_user: recordInfo?.total_user || 0,
        drift_dept_user: midRecordInfo?.drift_dept_user || 0,
        drift_user: midRecordInfo?.drift_user || 0,
        sync_user: recordInfo?.sync_user || 0,
        scope_user: recordInfo?.scope_user || 0,
        user_delete: recordInfo?.user_delete || 0,
        user_add: recordInfo?.user_add || 0,
        user_update: recordInfo?.user_update || 0,
        user_update_ignore: recordInfo?.user_update_ignore || 0,
        user_enable: recordInfo?.user_enable || 0,
        user_disable: recordInfo?.user_disable || 0,
        user_leader_update: recordInfo?.user_leader_update || 0,
        user_add_error: recordInfo?.user_add_error || 0,
        user_update_error: recordInfo?.user_update_error || 0,
        user_delete_error: recordInfo?.user_delete_error || 0,
        user_enable_error: recordInfo?.user_enable_error || 0,
        user_disable_error: recordInfo?.user_disable_error || 0,
        user_leader_update_error: recordInfo?.user_leader_update_error || 0,
        user_uncreate: 0,
        user_error: recordInfo?.user_error || 0,
      },
      dept: {
        total_dept: recordInfo?.total_dept || 0,
        scope_dept: recordInfo?.scope_dept || 0,
        sync_dept: recordInfo?.sync_dept || 0,
        drift_dept: midRecordInfo?.drift_dept || 0,
        dept_delete: recordInfo?.dept_delete || 0,
        dept_add: recordInfo?.dept_add || 0,
        dept_update: recordInfo?.dept_update || 0,
        dept_update_ignore: recordInfo?.dept_update_ignore || 0,
        dept_move: recordInfo?.dept_move || 0,
        dept_add_error: recordInfo?.dept_add_error || 0,
        dept_update_error: recordInfo?.dept_update_error || 0,
        dept_delete_error: recordInfo?.dept_delete_error || 0,
        dept_move_error: recordInfo?.dept_move_error || 0,
        dept_error: recordInfo?.dept_error || 0,
      },
      dept_user: {
        total_dept_user: recordInfo?.total_dept_user || 0,
        scope_dept_user: recordInfo?.scope_dept_user || 0,
        // sync_dept_user: recordInfo?.sync_dept_user || 0,
        dept_user_delete: recordInfo?.dept_user_delete || 0,
        dept_user_add: recordInfo?.dept_user_add || 0,
        user_sort_or_main_dept_update: recordInfo?.user_dept_update || 0,
        dept_user_add_error: recordInfo?.dept_user_add_error || 0,
        dept_user_delete_error: recordInfo?.dept_user_delete_error || 0,
        user_sort_or_main_dept_update_error: recordInfo?.user_dept_update_error || 0,
        dept_user_error: recordInfo?.dept_user_error || 0,
      }
    }

    // let userAddErrExtraInfo = await this.statisticAnalyseSrv.getFullSyncErrAnalyseRecordList(companyId, taskId, 0, 1, {
    //   sync_tb_type: StatisticAnalyseTbType.User,
    //   operate_type: StatisticAnalyseOperateType.UserAdd,
    //   err_type: StatisticAnalyseErrType.UserAddErrorCount
    // })
    // if (userAddErrExtraInfo.length == 1) {
    //   let userAddExtraJson = JSON.parse(userAddErrExtraInfo[0].extra) as IUserAddErrorExtra
    //   respInfo.user.user_add_error = userAddExtraJson.addErrCount
    //   respInfo.user.user_enable = userAddExtraJson.enableSuccessCount
    //   respInfo.user.user_disable = userAddExtraJson.disableSuccessCount
    //   respInfo.user.user_delete_error = userAddExtraJson.deleteErrCount
    //   respInfo.user.user_update_error = userAddExtraJson.updateErrCount
    //   respInfo.user.user_enable_error = userAddExtraJson.enableErrCount
    //   respInfo.user.user_disable_error = userAddExtraJson.disableErrCount
    // }

    let deptAddErrExtraInfo = await this.statisticAnalyseSrv.getFullSyncErrAnalyseRecordList(companyId, taskId, 0, 1, {
      sync_tb_type: StatisticAnalyseTbType.Dept,
      operate_type: StatisticAnalyseOperateType.DeptAdd,
      err_type: StatisticAnalyseErrType.DeptAddErrorCount
    })
    if (deptAddErrExtraInfo.length == 1) {
      let deptAddExtraJson = JSON.parse(deptAddErrExtraInfo[0].extra) as IDeptAddErrorExtra
      respInfo.dept.dept_add_error = deptAddExtraJson.totalDeptAddError
      respInfo.user.user_uncreate = deptAddExtraJson.totalUserUnAdd
      // respInfo.dept.dept_delete_error = deptAddExtraJson.deleteErrCount
      // respInfo.dept.dept_move_error = deptAddExtraJson.moveErrCount
      // respInfo.dept.dept_update_error = deptAddExtraJson.updateErrCount
    }

    // let deptUserAddErrExtraInfo = await this.statisticAnalyseSrv.getFullSyncErrAnalyseRecordList(companyId, taskId, 0, 1, {
    //   sync_tb_type: StatisticAnalyseTbType.DeptUser,
    //   operate_type: StatisticAnalyseOperateType.DeptUserAdd,
    //   err_type: StatisticAnalyseErrType.DeptUserAddErrorCount
    // })
    // if (deptUserAddErrExtraInfo.length == 1) {
    //   let deptUserAddExtraJson = JSON.parse(deptUserAddErrExtraInfo[0].extra) as IDeptUserAddErrorExtra
    //   respInfo.dept_user.dept_user_add_error = deptUserAddExtraJson.addErrCount
    //   respInfo.dept_user.dept_user_delete_error = deptUserAddExtraJson.deleteErrCount
    //   // respInfo.dept_user.dept_user_sort_error = deptUserAddExtraJson.userOrderUpdateErrCount
    //   // respInfo.dept_user.dept_user_update_error = deptUserAddExtraJson.mainDeptUpdateErrCount
    //   respInfo.dept_user.user_sort_or_main_dept_update_error = deptUserAddExtraJson.userOrderOrMianDeptUpdateErrCount
    // }

    return respInfo
  }

  async queryFullSyncTaskErrDetails(taskId: string, companyId: string, offset: number, limit: number, params: IAnalyseErrorDetailReqParams): Promise<any> {
    // 查询分析表status，判断分析是否为分析成功状态
    // 如果分析成功，返回分析结果
    // 如果分析未完成，返回空值
    // let record = await this.statisticAnalyseSrv.getFullSyncTaskAnalyseRecord(companyId, taskId)
    // if (!record || record.status !== FullSyncStatisticAnalyseStatus.ANALYSE_SUCCESS) {
    //   return null
    // }
    if (params.syncTbType === StatisticAnalyseTbType.User) {
      const total = await this.statisticAnalyseSrv.getFullSyncUserRecordListCount(taskId, RecordStatus.FAIL, params.updateType, params.errType, params.content)
      const list = await this.statisticAnalyseSrv.getFullSyncUserRecordList(taskId, offset, limit, RecordStatus.FAIL, params.updateType, params.errType, params.content)
      return {
        total,
        rows: list
      }
    } else if (params.syncTbType === StatisticAnalyseTbType.Dept) {
      const total = await this.statisticAnalyseSrv.getFullSyncDeptRecordListCount(taskId, RecordStatus.FAIL, params.updateType, params.errType, params.content)
      const list = await this.statisticAnalyseSrv.getFullSyncDeptRecordList(taskId, offset, limit, RecordStatus.FAIL, params.updateType, params.errType, params.content)
      return {
        total,
        rows: list
      }
    } else if (params.syncTbType === StatisticAnalyseTbType.DeptUser) {
      const total = await this.statisticAnalyseSrv.getFullSyncDeptUserRecordListCount(taskId, RecordStatus.FAIL, params.updateType, params.errType, params.content)
      const list = await this.statisticAnalyseSrv.getFullSyncDeptUserRecordList(taskId, offset, limit, RecordStatus.FAIL, params.updateType, params.errType, params.content)
      return {
        total,
        rows: list
      }
    }
  }

  async queryFullSyncAnalyseErrList(companyId: string, taskId: string, offset: number, limit: number, ovs: AnalyseListOvs) {
    // 查询分析表status，判断分析是否为分析成功状态
    // 如果分析成功，返回分析结果
    // 如果分析未完成，返回空值
    let record = await this.statisticAnalyseSrv.getFullSyncTaskAnalyseRecord(companyId, taskId)
    if (!record || record.status !== FullSyncStatisticAnalyseStatus.ANALYSE_SUCCESS) {
      return null
    }
    const total = await this.statisticAnalyseSrv.getFullSyncErrAnalyseRecordCount(companyId, taskId, ovs)
    const list = await this.statisticAnalyseSrv.getFullSyncErrAnalyseRecordList(companyId, taskId, offset, limit, ovs)
    return {
      total,
      rows: list
    }
  }
}

export default new StatisticAnalyse()
