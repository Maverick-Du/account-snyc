import LasAdminService from "../service/LasAdminService";
import FullSyncTaskService from "../service/FullSyncTaskService";
import syncJobSettingService from '../service/SyncJobSettingService'
import sync from "../sync";
import {FullSyncStatus, IncrementStatus, RecordStatus, SyncJobSettingOpenStatus, SyncJobSettingRateType, SyncType} from "../db/types";
import {
  IFullSyncTaskDetail,
  IIncrementSyncDetail,
  IIncrementSyncTimeDetail,
  IncrementScheduleTime,
  IncrementSyncType,
  IFullSyncTaskListItem,
  ISuccessTaskSchedule,
  DOWNLOAD_DETAIL_SHEET_HEADERS_MAP,
  DOWNLOAD_DETAIL_SHEET_NAMES_MAP,
  IDetailDownloadUserSheetHeader,
  IDetailDownloadBaseSheetHeader,
  IDetailDownloadDeptSheetHeader,
  FULL_SYNC_UPDATE_TYPE_MAP,
  IDetailDownloadUserDeptSheetHeader,
  IFailDetailDownloadSheetHeader,
  FAIL_DOWNLOAD_DETAIL_SHEET_HEADER,
  FAIL_DOWNLOAD_DETAIL_TYPE_MAP,
  IWarnDetailDownloadSheetHeader,
  WARN_DOWNLOAD_DETAIL_SHEET_HEADER,
  WARN_DOWNLOAD_DETAIL_TYPE_MAP,
  IncrementScheduleTimeSQL,
  ISuccessTaskScheduleSQL
} from "./type";
import {LasDeptIncrementSchema} from "../db/tables/LasDepartmentIncrement";
import {LasUserIncrementSchema} from "../db/tables/LasUserIncrement";
import {LasDeptUserIncrementSchema} from "../db/tables/LasDepartmentUserIncrement";
import {ScheduleJobType} from "../schedule/ScheduleService";
import * as  xlsx from 'xlsx'
import {format, parse} from "date-fns";
import {ISyncCommon} from "../increment_sync/types";
import {SYNC_JOB_SETTING_DEFAULT_RATE} from "./constant";
import {formatTimeToSQL} from "../../common/util";
import {CommonErrorName, StopTaskEntity} from "../sync/types";
import {AuditIncrementRetryData} from "../audit/type";
import { log } from "../../sdk/cognac";

export class Admin {
  private lasAdminService = LasAdminService
  private fullSyncTaskService = FullSyncTaskService

  /**
   * 获取全量同步任务详情
   * @param taskId - 任务taskId
   * @param companyId - 租户id
   * @returns 获取的任务详情
   */
  public async getFullSyncTaskDetail(taskId: string, companyId: string): Promise<IFullSyncTaskDetail> {
    const taskDetail = await this.lasAdminService.getFullSyncTaskDetail(taskId, companyId)
    if (taskDetail.length === 0) {
      throw new Error(`未找到对应的同步记录，taskId: ${taskId} companyId: ${companyId}`)
    }
    const task = taskDetail[0]

    // 判断该任务是否可重试、是否可忽略
    let isRetry: boolean = false
    let isIgnore: boolean = false

    // 失败任务情况下，判断是否可重试、是否可忽略
    if (task.status === FullSyncStatus.SYNC_FAIL) {
      let exist = await this.lasAdminService.checkTaskCanRun(task.bid, companyId)
      if (!exist || exist.length <= 0) {
        isRetry = true
      }

      // 若该任务后存在全量同步任务(自动、手动)(同步中、同步成功)，则不可重试，不可忽略
      // const latestTaskDataSuccessOrSyncIng = await this.lasAdminService.getLatestFullSyncTasksSuccessOrSyncIng(companyId, task.bid)
      // if (latestTaskDataSuccessOrSyncIng.length <= 0) {
      //   isIgnore = true
      // }
      // 若该任务后存在自动全量同步任务(待同步)，则不可以重试
      // const latestTaskDataToSyncAuto = await this.lasAdminService.getLatestFullSyncTasksToSyncByAuto(companyId, task.bid)
      // if (latestTaskDataToSyncAuto.length <= 0 && latestTaskDataSuccessOrSyncIng.length <= 0) {
      //   isRetry = true
      // }
      // 若开关配置关闭，则可忽略
      const syncJobSetting = await syncJobSettingService.getSyncConfig(companyId, ScheduleJobType.FULL_SYNC_JOB)
      if (syncJobSetting && syncJobSetting.open == SyncJobSettingOpenStatus.DISABLE ) {
        isIgnore = true
      }
    }

    // 成功任务情况下，判断是否可重试（成功任务有异常数据情况）
    if (task.status === FullSyncStatus.SYNC_SUCCESS && task.total_error > 0) {
      let exist = await this.lasAdminService.checkTaskCanRun(task.bid, companyId)
      if (!exist || exist.length <= 0) {
        isRetry = true
      }

      // 若该任务后存在全量同步任务(自动、手动)(同步中、同步成功)，若该任务后存在自动全量同步任务(待同步)，则不可重试
      // const latestTaskDataSuccessOrSyncIng = await this.lasAdminService.getLatestFullSyncTasksSuccessOrSyncIng(companyId, task.bid)
      // const latestTaskDataToSyncAuto = await this.lasAdminService.getLatestFullSyncTasksToSyncByAuto(companyId, task.bid)
      // if (latestTaskDataSuccessOrSyncIng.length <= 0 && latestTaskDataToSyncAuto.length <= 0 ) {
      //   isRetry = true
      // }
    }

    return {
      ...task,
      is_retry: isRetry,
      is_ignore: isIgnore
    }
  }

  /**
   * 获取全量同步任务列表
   * @param status - 任务状态
   * @param syncWay - 同步方式 [手动 auto、自动 manual]
   * @param offset - 偏移量
   * @param limit - 每页数量
   * @param companyId - 租户id
   * @returns 任务列表
   */
  async getFullSyncTaskList(status: FullSyncStatus[], syncWay: SyncType[], offset: number, limit: number, companyId: string) {
    const taskList = await this.lasAdminService.getFullSyncTasks(status, syncWay, offset, limit, companyId)
    const taskTotal = await this.lasAdminService.getFullSyncTasksCount(status, syncWay, companyId)

    const newTaskList: IFullSyncTaskListItem[] = [];
    let isNoRetry: boolean = false  // 是否不可执行重试操作 true：不可执行  false：可执行
    let isContinueSync: boolean = true // 是否可继续同步 true: 可执行 false: 不可执行

    // let checkRetry: boolean = false
    // let checkContinue: boolean = false
    let noNeedCheck: boolean = false
    for (const task of taskList.data.rows) {
      if (task.status == FullSyncStatus.SYNC_CANCEL) {
        newTaskList.push({
          ...task,
          is_retry: false,
          is_continue_sync: false
        })
        continue
      }
      if (noNeedCheck) {
        newTaskList.push({
          ...task,
          is_retry: false,
          is_continue_sync: false
        })
        continue
      }
      if (task.status == FullSyncStatus.TO_SYNC || task.status == FullSyncStatus.SYNC_ING || task.status == FullSyncStatus.SYNC_SUCCESS) {
        newTaskList.push({
          ...task,
          is_retry: false,
          is_continue_sync: false
        })
        noNeedCheck = true
        continue
      }
      let exist = await this.lasAdminService.checkTaskCanRun(task.id, companyId)
      if (task.status == FullSyncStatus.SYNC_FAIL) {
        newTaskList.push({
          ...task,
          is_retry: !exist || exist.length <= 0,
          is_continue_sync: false
        })
        noNeedCheck = true
        continue
      } else if (task.status == FullSyncStatus.SYNC_SCOPE_WARN || task.status == FullSyncStatus.SYNC_DEL_WARN) {
        newTaskList.push({
          ...task,
          is_retry: false,
          is_continue_sync: !exist || exist.length <= 0
        })
        noNeedCheck = true
        continue
      }
      newTaskList.push({ ...task, is_retry: false, is_continue_sync: false})
    }

    // for (const task of taskList.data.rows) {
    //   if (task.status === FullSyncStatus.SYNC_ING || task.status === FullSyncStatus.SYNC_SUCCESS) {
    //     isNoRetry = true
    //     isContinueSync = false
    //   }
    //   if (task.status === FullSyncStatus.TO_SYNC && task.sync_type === SyncType.AUTO) {
    //     isNoRetry = true
    //   }
    //   // 不为失败任务 且 不为告警任务，不可重试、不可继续同步
    //   if (task.status !== FullSyncStatus.SYNC_FAIL && task.status !== FullSyncStatus.SYNC_DEL_WARN && task.status!== FullSyncStatus.SYNC_SCOPE_WARN) {
    //     newTaskList.push({
    //       ...task,
    //       is_retry: false,
    //       is_continue_sync: false
    //     })
    //     continue
    //   }
    //   // 在列表数据中查询到不可重试任务，则不需要进行查表判断（提高查询效率）
    //     if (isNoRetry && !isContinueSync) {
    //     newTaskList.push({
    //       ...task,
    //       is_retry: false,
    //       is_continue_sync: false
    //     })
    //     continue
    //   }
    //   // 需要查表判断，是否可重试、是否可忽略
    //   const latestTaskSuccessOrSyncIng = await this.lasAdminService.getLatestFullSyncTasksSuccessOrSyncIng(companyId, task.id)
    //   const latestTaskToSyncByAuto = await this.lasAdminService.getLatestFullSyncTasksToSyncByAuto(companyId, task.id)
    //   if (latestTaskSuccessOrSyncIng.length > 0) {  // 全量同步（自动、手动）（同步成功、同步中）查询结果
    //     isNoRetry = true
    //     isContinueSync = false
    //     newTaskList.push({
    //       ...task,
    //       is_ignore: false,
    //       is_retry: false
    //     })
    //     continue
    //   }
    //   if (latestTaskToSyncByAuto.length > 0) { // 全量同步（自动）（待同步）查询结果
    //     isNoRetry = true
    //     newTaskList.push({
    //       ...task,
    //       is_retry: false,
    //       is_continue_sync: true
    //     })
    //     continue
    //   }
    //   newTaskList.push({ ...task, is_retry: true, is_continue_sync: true})
    //
    // }

    return {
      total: taskTotal,
      taskData: newTaskList
    }
  }

  /**
   * 取消全量同步任务
   *
   * 用于取消指定的全量同步任务，且任务状态必须为待同步状态
   *
   * @param taskId - 待取消的任务taskId
   * @param companyId -租户id
   * @param userId - 用户id
   * @param userName - 用户名称
   * @returns 更新任务状态的结果
   */
  public async cancelFullSyncTask(taskId: string, companyId: string, userId: string, userName: string) {
    // 1.判断该任务id是否存在
    const taskData = await this.lasAdminService.findFullSyncTaskByTaskId(taskId, companyId)
    if (!taskData) {
      throw new Error(`未找到对应的同步任务记录，taskId: ${taskId} company_id: ${companyId}`)
    }
    // 2.该任务是否在待同步状态
    if (taskData.status !== FullSyncStatus.TO_SYNC) {
      throw new Error(`该任务非待同步状态，无法取消`)
    }
    // 3.更新任务状态为 取消
    const timeNow = format(new Date(), 'yyyy.MM.dd HH:mm:ss')
    const msg = `${userName}(${userId})于${timeNow}}时间取消任务`
    return this.fullSyncTaskService.cancelTask(taskId, companyId, msg)
  }

  /**
   * 终止全量同步任务
   * @param taskId - 待终止的任务taskId
   * @param companyId - 租户id
   * @param userId - 用户id
   * @param userName - 用户名称
   * @returns 更新任务状态的结果
   */
  public async stopFullSyncTask(taskId: string, companyId: string, userId: string, userName: string) {
    // 1.该任务记录是否存在
    const taskData = await this.lasAdminService.findFullSyncTaskByTaskId(taskId, companyId)
    if (!taskData) {
      throw new Error(`未找到对应的同步任务记录，taskId: ${taskId} company_id: ${companyId}`)
    }
    // 2.该任务状态是否为同步中
    if (taskData.status !== FullSyncStatus.SYNC_ING) {
      throw new Error(`该任务非同步中状态，无法终止`)
    }
    // 3.终止该任务
    const timeNow = format(new Date(), 'yyyy.MM.dd HH:mm:ss')
    const msg = `${userName}(${userId})于${timeNow}时间终止任务`
    return this.fullSyncTaskService.stopTask({
      taskId: taskId,
      companyId: companyId,
      name: CommonErrorName.TaskCancel,
      msg: msg
    } as StopTaskEntity)
  }

  /**
   * 是否任务可重试
   * @param taskId - 任务id
   * @param companyId - 租户id
   * @returns true/false
   */
  public async isRetryFullSyncTask(taskId: string, companyId: string) {
    // 1.校验该任务id是否存在
    const taskData = await this.lasAdminService.getFullSyncTaskDetail(taskId, companyId)
    if (taskData.length <= 0) {
      throw new Error(`未找到对应的同步任务记录，taskId: ${taskId} company_id: ${companyId}`)
    }
    // 2.判断该任务是否是失败任务
    const task = taskData[0]
    if (task.status === FullSyncStatus.SYNC_FAIL) {
      let exist = await this.lasAdminService.checkTaskCanRun(task.bid, companyId)
      if (!exist || exist.length <= 0) {
        return true
      }

      // 3.若该任务后存在全量同步任务(自动、手动)(同步中、同步成功)，若该任务后存在自动全量同步任务(待同步)，则不可以重试
      // const latestTaskDataSuccessOrSyncIng = await this.lasAdminService.getLatestFullSyncTasksSuccessOrSyncIng(companyId, task.bid)
      // const latestTaskDataToSyncAuto = await this.lasAdminService.getLatestFullSyncTasksToSyncByAuto(companyId, task.bid)
      // if (latestTaskDataSuccessOrSyncIng.length <= 0 && latestTaskDataToSyncAuto.length <= 0) {
      //   return true
      // }
    }

    // 3.判断该任务是否是成功任务存在失败数据
    if (task.status === FullSyncStatus.SYNC_SUCCESS && task.total_error > 0) {
      let exist = await this.lasAdminService.checkTaskCanRun(task.bid, companyId)
      if (!exist || exist.length <= 0) {
        return true
      }

      // 3.若该任务后存在全量同步任务(自动、手动)(同步中、同步成功)，若该任务后存在自动全量同步任务(待同步)，则不可以重试
      // const latestTaskDataSuccessOrSyncIng = await this.lasAdminService.getLatestFullSyncTasksSuccessOrSyncIng(companyId, task.bid)
      // const latestTaskDataToSyncAuto = await this.lasAdminService.getLatestFullSyncTasksToSyncByAuto(companyId, task.bid)
      // if (latestTaskDataSuccessOrSyncIng.length <= 0 && latestTaskDataToSyncAuto.length <= 0) {
      //   return true
      // }
    }

    return false
  }

  /**
   * 重试同步任务
   * @param taskId - 任务id
   * @param companyId - 租户id
   * @param scheduleTime - 重试时间
   * @param operator - 操作人
   * @returns 新重试任务taskId
   */
  public async retryFullSyncTask(taskId: string, companyId: string, scheduleTime: Date, operator: string) {
    // 1.校验该任务是否可重试
    const isRetry = await this.isRetryFullSyncTask(taskId, companyId)
    if (!isRetry) {
      throw new Error(`该任务无法重试`)
    }
    // 2.重试
    return sync.extraFullSync(taskId, companyId, SyncType.MANUAL, operator, scheduleTime)
  }

  /**
   * 忽略重试任务
   * @param taskId - 任务id
   * @param companyId - 租户id
   */
  async ignoreFailFullSyncTask(taskId: string, companyId: string) {
    // 1.校验该任务id是否存在
    const task = await this.lasAdminService.findFullSyncTaskByTaskId(taskId, companyId)
    if (!task) {
      throw new Error(`未找到对应的同步记录，taskId: ${taskId} company_id ${companyId}`)
    }
    // 2.判断该任务是否是失败任务
    if (task.status !== FullSyncStatus.SYNC_FAIL) {
      throw new Error(`该任务同步状态非异常状态`)
    }
    // 3.执行忽略操作
    await syncJobSettingService.reopenSyncJob(companyId)
  }

  /**
   * 获取最近同步时间、同步开关（全量、增量）
   * @param companyId - 租户id
   * @returns 同步配置
   */
  async getSyncConfig(companyId: string) {
    const incrementSyncDetail = await this.lasAdminService.getSyncConfig(companyId, ScheduleJobType.INCREMENT_SYNC_JOB)
    const fullSyncDetail = await this.lasAdminService.getSyncConfig(companyId, ScheduleJobType.FULL_SYNC_JOB)
    let fullSyncEndTime: string
    let incrementSyncEndTime: string
    if (!fullSyncDetail || !fullSyncDetail.end_time) {
      fullSyncEndTime = ''
    } else {
      fullSyncEndTime = parse(fullSyncDetail.end_time, ISyncCommon.TIME_FORMAT, new Date()).toString()
    }
    if (!incrementSyncDetail || !incrementSyncDetail.end_time) {
      incrementSyncEndTime = ''
    } else {
      incrementSyncEndTime = parse(incrementSyncDetail.end_time, ISyncCommon.TIME_FORMAT, new Date()).toString()
    }
    return {
      full_sync_end: fullSyncEndTime,
      full_sync_open: fullSyncDetail ? fullSyncDetail.open : SyncJobSettingOpenStatus.DISABLE,
      increment_sync_end: incrementSyncEndTime,
      increment_sync_open: incrementSyncDetail ? incrementSyncDetail.open : SyncJobSettingOpenStatus.DISABLE
    }
  }

  /**
   * 获取增量同步任务列表
   * @param type - 同步类型 user：用户同步 dept：部门同步 user_dept：用户部门同步
   * @param syncWay - 同步方式 manual：手动 auto：自动
   * @param status - 状态 1：成功 -1：失败
   * @param offset - 偏移量
   * @param limit - 每页条数
   * @param companyId - 租户id
   * @param content - 搜索内容
   * @param scheduleTime - 搜索任务执行时间范围
   * @returns 增量同步列表
   */
  async getIncrementSyncList(type: IncrementSyncType, syncWay: SyncType[], status: IncrementStatus[],offset: number, limit: number, companyId: string, content: string | undefined, scheduleTime: IncrementScheduleTime | undefined) {
    // 1. 先判断要查那张表
    let scheduleTimeSQL: IncrementScheduleTimeSQL | undefined = undefined
    if (!!scheduleTime) {
      scheduleTimeSQL = {
        startTime: formatTimeToSQL(scheduleTime.startTime),
        endTime: formatTimeToSQL(scheduleTime.endTime)
      }
    }
    // 云文档租户id 获取 三方租户id，若不存在，结果返回空
    const thirdCompanyIdData = await this.lasAdminService.getCompanyCfg(companyId)
    if (!thirdCompanyIdData || !thirdCompanyIdData.third_company_id) {
      return {
        total: 0,
        data: [] as any
      }
      // throw new Error(`未找到对应的租户关系配置`)
    }
    let thirdCompanyId = thirdCompanyIdData.third_company_id
    if (type === IncrementSyncType.USER) {
      const userList = await this.lasAdminService.getIncrementSyncUserList(syncWay, status, offset, limit, thirdCompanyId,  content, scheduleTimeSQL)
      const total = await this.lasAdminService.getIncrementSyncUserListCount(syncWay, status, thirdCompanyId, content, scheduleTimeSQL)
      return {
        total,
        taskData: userList
      }
    } else if (type === IncrementSyncType.DEPT) {
      const deptList = await this.lasAdminService.getIncrementSyncDeptList(syncWay, status, offset, limit, thirdCompanyId, content, scheduleTimeSQL)
      const total = await this.lasAdminService.getIncrementSyncDeptListCount(syncWay, status, thirdCompanyId, content, scheduleTimeSQL)
      return {
        total,
        taskData: deptList
      }
    } else if (type === IncrementSyncType.USER_DEPT) {
      const deptUserList = await this.lasAdminService.getIncrementSyncDeptUserList(syncWay, status, offset, limit, thirdCompanyId, scheduleTimeSQL)
      const total = await this.lasAdminService.getIncrementSyncDeptUserListCount(syncWay, status, thirdCompanyId, scheduleTimeSQL)
      return {
        total,
        taskData: deptUserList
      }
    }
  }

  /**
   * 增量同步记录详情
   * @param id - 记录id
   * @param type - 记录类型 user：用户同步 dept：部门同步 user_dept：用户部门同步
   * @param companyId
   * @returns 详情
   */
  async getIncrementSyncDetail(id: number, type: IncrementSyncType, companyId: string): Promise<IIncrementSyncDetail> {
    let detail: LasDeptIncrementSchema | LasUserIncrementSchema | LasDeptUserIncrementSchema
    // 云文档租户id 获取 三方租户id
    const thirdCompanyIdData = await this.lasAdminService.getCompanyCfg(companyId)
    if (!thirdCompanyIdData || !thirdCompanyIdData.third_company_id) {
      throw new Error("未找到对应的租户关系配置")
    }
    let thirdCompanyId = thirdCompanyIdData.third_company_id
    if (type === IncrementSyncType.DEPT) {
      detail = await this.lasAdminService.getDeptIncrementDetail(id, thirdCompanyId)
    } else if (type === IncrementSyncType.USER) {
      detail = await this.lasAdminService.getUserIncrementDetail(id, thirdCompanyId)
      delete detail.password
    } else if (type === IncrementSyncType.USER_DEPT) {
      detail = await this.lasAdminService.getDeptUserIncrementDetail(id, thirdCompanyId)
    }
    if (!detail) {
      throw new Error(`未找到详情数据，id: ${id}, type: ${type}`)
    }
    return  {
      id: detail.id,
      sync_type: detail.sync_type,
      update_type: detail.update_type,
      status: detail.status,
      operator: detail.operator,
      msg: detail.msg,
      mtime: detail.mtime,
      jsonData: detail
    } as IIncrementSyncDetail
  }

  /**
   * 增量同步任务是否可重试
   * @param id - id
   * @param type - 类型 user：用户同步 dept：部门同步 user_dept：用户部门同步
   * @param companyId
   * @returns boolean
   */
  async incrementSyncTaskIsRetry(id: number, type: IncrementSyncType, companyId: string) {
    // 先简单处理，只有失败任务可重试
    let result: LasDeptIncrementSchema | LasUserIncrementSchema | LasDeptUserIncrementSchema
    if (type === IncrementSyncType.DEPT) {
      result = await this.lasAdminService.getDeptIncrementDetail(id, companyId)
      if (!result) {
          throw new Error(`未找到对应记录，id: ${id}, type: ${type}`)
      }
    } else if (type === IncrementSyncType.USER) {
      result = await this.lasAdminService.getUserIncrementDetail(id, companyId)
      if (!result) {
          throw new Error(`未找到对应记录，id: ${id}, type: ${type}`)
      }
    } else if (type === IncrementSyncType.USER_DEPT) {
      result = await this.lasAdminService.getDeptUserIncrementDetail(id, companyId)
      if (!result) {
          throw new Error(`未找到对应记录，id: ${id}, type: ${type}`)
      }
    }
    return result.status === IncrementStatus.FAIL;
  }

  /**
   * 增量同步任务重试
   * @param id - id
   * @param type - 类型 user：用户同步 dept：部门同步 user_dept：用户部门同步
   * @param companyId
   * @param userName
   * @returns number
   */
  async incrementSyncTaskRetry(id: number, type: IncrementSyncType, companyId: string, userName: string) {
    // 审计日志所需数据
    let auditLogData: AuditIncrementRetryData
    // 云文档租户id 获取 三方租户id，若不存在，报错
    const thirdCompanyIdData = await this.lasAdminService.getCompanyCfg(companyId)
    if (!thirdCompanyIdData || !thirdCompanyIdData.third_company_id) {
      throw new Error("未找到对应的租户关系配置")
    }
    const thirdCompanyId = thirdCompanyIdData.third_company_id
    // 1.判断该增量任务是否可重试
    const isRetry = await this.incrementSyncTaskIsRetry(id, type, thirdCompanyId)
    if (!isRetry) {
      throw new Error(`该记录不可以重试`)
    }
    // 2.依据type类型分别重试，不同表添加一条记录
    // 2.1查看该重试记录是否存在
    if (type === IncrementSyncType.DEPT) {
      const detail = await this.lasAdminService.getDeptIncrementDetail(id, thirdCompanyId)
      if (!detail) {
        throw new Error(`未找到对应记录，id: ${id}, type: ${type}`)
      }
      const record: Partial<LasDeptIncrementSchema> = {
        third_company_id: detail.third_company_id,
        platform_id: detail.platform_id,
        did: detail.did,
        pid: detail.pid,
        name: detail.name,
        order: detail.order,
        source: detail.source,
        operator: userName,
        sync_type: SyncType.MANUAL,
        update_type: detail.update_type,
      }
      if (detail.type) record.type = detail.type
      const detailId = await  this.lasAdminService.addIncrementDept(record)
      auditLogData = {
        uid: '',
        uName: '',
        did: record.did,
        dName: record.name
      }
      return {
        detailId,
        auditLogData,
        updateType: record.update_type
      }
    } else if (type === IncrementSyncType.USER) {
      const detail = await this.lasAdminService.getUserIncrementDetail(id, thirdCompanyId)
      if (!detail) {
        throw new Error(`未找到对应记录，id: ${id}, type: ${type}`)
      }
      const record: Partial<LasUserIncrementSchema> = {
        third_company_id: detail.third_company_id,
        platform_id: detail.platform_id,
        uid: detail.uid,
        def_did: detail.def_did,
        def_did_order: detail.def_did_order,
        account: detail.account,
        nick_name: detail.nick_name,
        password: detail.password,
        avatar: detail.avatar,
        email: detail.email,
        gender: detail.gender,
        title: detail.title,
        work_place: detail.work_place,
        leader: detail.leader,
        employer: detail.employer,
        employment_status: detail.employment_status,
        employment_type: detail.employment_type,
        phone: detail.phone,
        telephone: detail.telephone,
        source: detail.source,
        custom_fields: detail.custom_fields,
        operator: userName,
        sync_type: SyncType.MANUAL,
        update_type: detail.update_type,
      }
      const detailId = await this.lasAdminService.addIncrementUser(record)
      auditLogData = {
        uid: record.uid,
        uName: record.nick_name,
        did: '',
        dName: ''
      }
      return {
        detailId,
        auditLogData,
        updateType: record.update_type
      }
    } else if (type === IncrementSyncType.USER_DEPT) {
      const detail = await this.lasAdminService.getDeptUserIncrementDetail(id, thirdCompanyId)
      if (!detail) {
        throw new Error(`未找到对应记录，id: ${id}, type: ${type}`)
      }
      const record: Partial<LasDeptUserIncrementSchema> = {
        third_company_id: detail.third_company_id,
        platform_id: detail.platform_id,
        uid: detail.uid,
        did: detail.did,
        order: detail.order,
        main: detail.main,
        operator: userName,
        sync_type: SyncType.MANUAL,
        update_type: detail.update_type,
        status: detail.status,
        msg: detail.msg,
      }
      const detailId = await this.lasAdminService.addIncrementDeptUser(record)
      auditLogData = {
        uid: record.uid,
        uName: '',
        did: record.did,
        dName: ''
      }
      return {
        detailId,
        auditLogData,
        updateType: record.update_type
      }
    }
  }

  /**
   * 获取增量同步配置
   * @param companyId - 租户id
   * @returns 配置详情
   */
  async getIncrementSyncConfig(companyId: string): Promise<IIncrementSyncTimeDetail> {
    const detail = await this.lasAdminService.getSyncConfig(companyId, ScheduleJobType.INCREMENT_SYNC_JOB)

    if (!detail) {
      await syncJobSettingService.initIncrementSyncConfig(companyId)
    }
    // detail 不存在使用默认配置
    return {
      type: detail ? detail.type : SyncJobSettingRateType.MIN,
      open: detail ? detail.open : SyncJobSettingOpenStatus.ENABLE,
      rate: detail ? detail.rate : SYNC_JOB_SETTING_DEFAULT_RATE
    }
  }

  /**
   * 增量同步配置设置
   * @param companyId - 租户id
   * @param open - 开启状态 0：关闭 1：开启
   * @param type - 同步频率类型 min：分钟  hour：小时
   * @param rate - 同步频率
   * @returns boolean 是否设置成功
   */
  async incrementSyncConfigSet(companyId: string, open: SyncJobSettingOpenStatus, type: SyncJobSettingRateType, rate: number) {
    try {
      // 1.生成cron表达式
      const cron = this.createCronExpression(type, rate)
      // 2.更新增量同步起始时间表
      return await syncJobSettingService.updateSyncConfig({
        company_id: companyId,
        sync_type: ScheduleJobType.INCREMENT_SYNC_JOB,
        type: type,
        rate: rate,
        open: open,
        cron: cron
      })
    } catch (error) {
      log.e(error)
      return false
    }
  }

  /**
   * 获取全量同步配置
   * @param companyId - 租户id
   * @returns 配置详情
   */
  async getFullSyncConfig(companyId: string) {
    const detail = await this.lasAdminService.getSyncConfig(companyId, ScheduleJobType.FULL_SYNC_JOB)
    if (!detail) {
      await syncJobSettingService.initFullSyncConfig(companyId)
    }
    return {
      open: detail ? detail.open : SyncJobSettingOpenStatus.ENABLE
    }
  }

  /**
   * 全量同步配置设置
   * @param open - 开启状态 0：关闭 1：开启
   * @param companyId - 租户id
   * @returns boolean 是否设置成功
   */
  async fullSyncConfigSet(open: SyncJobSettingOpenStatus, companyId: string) {
    try {
      return await syncJobSettingService.updateSyncConfig({
        company_id: companyId,
        sync_type: ScheduleJobType.FULL_SYNC_JOB,
        open: open
      })
    } catch (error) {
      log.e(error)
      return false
    }
  }

  /**
   * 创建 cron 表达式
   * @param type - 同步频率类型 min：分钟  hour：小时
   * @param rate - 同步频率
   * @returns string cron 表达式
   */
  createCronExpression(type: SyncJobSettingRateType, rate: number ) {
    if (type === SyncJobSettingRateType.MIN) {
      return `0 0/${rate} * * * ?`
    } else if (type === SyncJobSettingRateType.HOUR) {
      return `0 0 0/${rate} * * ?`
    }
  }

  async createRollbackTask(taskId: string, companyId: string, account: string, userName: string) {
    // 云文档租户id 获取 三方租户id，若不存在，报错
    const thirdCompanyIdData = await this.lasAdminService.getCompanyCfg(companyId)
    if (!thirdCompanyIdData || !thirdCompanyIdData.third_company_id) {
      throw new Error(`未找到对应的租户关系配置`)
    }
    // 1. 判断当前任务是否可回滚
    //  1.1 当前待回滚任务是否存在
    //  1.2 该任务是否为全量成功任务
    //  1.3 判断与该任务关联采集表数据是否被请求，若清理，则进行报错提示，本次创建忽略
    const taskDetail = await this.lasAdminService.findFullSyncTaskByTaskId(taskId, companyId)
    if (!taskDetail) {
      throw new Error(`未找到对应的同步任务，taskId: ${taskId} companyId: ${companyId}`)
    }
    if (taskDetail.status !== FullSyncStatus.SYNC_SUCCESS) {
      throw new Error( `该任务非成功状态，无法回滚`)
    }
    let originTaskId = this.fullSyncTaskService.getOriginTaskId(taskId)
    const { deptCount, userCount, deptUserCount } = await this.lasAdminService.countLasTaskData(originTaskId, thirdCompanyIdData.third_company_id)
    if (deptCount <= 0 || userCount <= 0 || deptUserCount <= 0) {
      throw new Error(`当前任务采集数据已被清理，请重新选择回滚数据`)
    }
    // 3. 创建回滚任务
    return sync.extraFullSync(taskId, companyId, SyncType.ROLLBACK, `${userName}（${account}）`, new Date())
  }

  /**
   * 回滚任务列表数据
   * @param {string} companyId 云文档租户id
   * @param {number} offset 页数
   * @param {number} limit 分页大小
   * @returns
   */
  async getRollbackTaskList(companyId: string, offset: number, limit: number) {
    const rollbackTaskList = await this.lasAdminService.getRollbackTasks(companyId, offset, limit)
    const rollbackTasksCount = await this.lasAdminService.getRollbackTasksCount(companyId)
    return {
      taskList: rollbackTaskList.data.rows,
      total: rollbackTasksCount
    }

  }

  /**
   * 回滚时获取成功任务列表数据
   * @param {string} companyId 云文档租户id
   * @param {number} offset 页数
   * @param {number} limit 分页大小
   * @param {string} content 模糊查询内容
   * @param {ISuccessTaskSchedule} scheduleTime 查询时间范围
   * @returns
   */
  async getFullSyncSuccessTasks(companyId: string, offset: number, limit: number, scheduleTime: ISuccessTaskSchedule, content: string | undefined, ) {
    let scheduleTimeSQL: ISuccessTaskScheduleSQL = {
      startTime: formatTimeToSQL(scheduleTime.startTime),
      endTime: formatTimeToSQL(scheduleTime.endTime)
    }
    const successTaskList = await this.lasAdminService.getFullSyncSuccessTasks(companyId, offset, limit, content, scheduleTimeSQL)
    const successTasksCount = await this.lasAdminService.getFullSyncSuccessTasksCount(companyId, content, scheduleTimeSQL)
    return {
      taskList: successTaskList.data.rows,
      total: successTasksCount
    }
  }

  /**
   * 全量同步详情下载
   * @param {string} companyId
   * @param {string} taskId
   * @returns
   */
  async fullSyncDetailDownload(companyId: string, taskId: string): Promise<xlsx.WorkBook> {
    // 前置判断，全量同步任务 && 同步完成、同步异常、同步警告（阈值警告、范围警告）
    const taskDetail = await this.lasAdminService.findFullSyncTaskByTaskId(taskId, companyId)
    if (!taskDetail) {
      throw new Error(`未找到详情记录，taskId: ${taskId} companyId: ${companyId}`)
    }
    if (taskDetail.status!== FullSyncStatus.SYNC_SUCCESS && taskDetail.status!== FullSyncStatus.SYNC_FAIL && taskDetail.status!== FullSyncStatus.SYNC_DEL_WARN && taskDetail.status!== FullSyncStatus.SYNC_SCOPE_WARN) {
      throw new Error( `该任务状态无详情数据下载`)
    }

    // 取三张记录表记录数据 （用户、部门、用户部门关系表数据）
    const userRecords = await this.lasAdminService.getUserRecordsByStatus(companyId, taskId, [RecordStatus.SUCCESS, RecordStatus.FAIL])
    const deptRecords = await this.lasAdminService.getDeptRecordsByStatus(companyId, taskId, [RecordStatus.SUCCESS, RecordStatus.FAIL])
    const deptUserRecords = await this.lasAdminService.getDeptUserRecordsByStatus(companyId, taskId, [RecordStatus.SUCCESS, RecordStatus.FAIL])

    // 创建workbook
    const workbook = xlsx.utils.book_new()

    // 创建三张sheet表，分别把数据添加进入三张sheet表里
    // 将三张sheet表加入workbook中
    DOWNLOAD_DETAIL_SHEET_HEADERS_MAP.forEach((value, key) => {
      // sheet表名
      const sheetName = DOWNLOAD_DETAIL_SHEET_NAMES_MAP.get(key)
      // 整合数据
      let data: IDetailDownloadBaseSheetHeader[] = []
      if (key === 'user') {
        data = [
          value,
         ...userRecords.map((item) => {
          return {
            userName: item.name,
            account: item.account,
            thirdId: item.uid,
            deptPath: item.abs_path,
            result: item.status === 1 ? '成功' : '失败',
            syncOperation: FULL_SYNC_UPDATE_TYPE_MAP.get(item.update_type),
            errMsg: item.msg
          } as IDetailDownloadUserSheetHeader
         })
        ]
      } else if (key === 'dept') {
        data = [
          value,
         ...deptRecords.map((item) => {
            return {
              deptName: item.name,
              thirdId: item.did,
              deptPath: item.abs_path,
              result: item.status === 1? '成功' : '失败',
              syncOperation: FULL_SYNC_UPDATE_TYPE_MAP.get(item.update_type),
              errMsg: item.msg
            } as IDetailDownloadDeptSheetHeader
          })
        ]
      } else if (key === 'deptUser') {
        data = [
          value,
          ...deptUserRecords.map((item) => {
            return {
              userName: item.name,
              account: item.account,
              thirdId: item.uid,
              deptPath: item.abs_path,
              result: item.status === 1? '成功' : '失败',
              syncOperation: FULL_SYNC_UPDATE_TYPE_MAP.get(item.update_type),
              errMsg: item.msg
            } as IDetailDownloadUserDeptSheetHeader
          })
        ]
      }

      // 生成worksheet
      const worksheet = xlsx.utils.json_to_sheet(data, { skipHeader: true})
      // 生成表单
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName)
    })

    return workbook
  }

  /**
   * 全量同步失败详情下载
   * @param {string} companyId
   * @param {string} taskId
   * @returns
   */
  async fullSyncFailDetailDownload(companyId: string, taskId: string): Promise<xlsx.WorkBook> {
    // 前置判断 全量同步任务 && 同步完成、同步异常
    const taskDetail = await this.lasAdminService.findFullSyncTaskByTaskId(taskId, companyId)
    if (!taskDetail) {
      throw new Error(`未找到详情记录，taskId: ${taskId} companyId: ${companyId}`)
    }
    if (taskDetail.status!== FullSyncStatus.SYNC_SUCCESS && taskDetail.status!== FullSyncStatus.SYNC_FAIL) {
      throw new Error( `该任务状态无详情数据下载`)
    }

    // 获取三张表失败数据
    const userRecords = await this.lasAdminService.getUserRecordsByStatus(companyId, taskId, [RecordStatus.FAIL])
    const deptRecords = await this.lasAdminService.getDeptRecordsByStatus(companyId, taskId, [RecordStatus.FAIL])
    const deptUserRecords = await this.lasAdminService.getDeptUserRecordsByStatus(companyId, taskId, [RecordStatus.FAIL])

    // 创建workbook
    const workbook = xlsx.utils.book_new()

    // 整合数据
    let data: IFailDetailDownloadSheetHeader[] = []
    data = [
      FAIL_DOWNLOAD_DETAIL_SHEET_HEADER,
      ...userRecords.map(item => {
        return {
          type: FAIL_DOWNLOAD_DETAIL_TYPE_MAP.get('user'),
          name: item.name,
          account: item.account,
          thirdId: item.uid,
          deptPath: item.abs_path,
          result: '失败',
          syncOperation: FULL_SYNC_UPDATE_TYPE_MAP.get(item.update_type),
          errMsg: item.msg
        }
      }),
      ...deptRecords.map(item => {
        return {
          type: FAIL_DOWNLOAD_DETAIL_TYPE_MAP.get('dept'),
          name: item.name,
          account: '',
          thirdId: item.did,
          deptPath: item.abs_path,
          result: '失败',
          syncOperation: FULL_SYNC_UPDATE_TYPE_MAP.get(item.update_type),
          errMsg: item.msg
        }
      }),
      ...deptUserRecords.map(item => {
        return {
          type: FAIL_DOWNLOAD_DETAIL_TYPE_MAP.get('deptUser'),
          name: item.name,
          account: item.account,
          thirdId: item.uid,
          deptPath: item.abs_path,
          result: '失败',
          syncOperation: FULL_SYNC_UPDATE_TYPE_MAP.get(item.update_type),
          errMsg: item.msg
        }
      })
    ]

    // 创建sheet表，把数据添加进入sheet表里
    const worksheet = xlsx.utils.json_to_sheet(data, { skipHeader: true })
    // 将sheet加入到book中
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    return workbook
  }

  /**
   * 全量同步警告详情下载
   * @param {string} companyId
   * @param {string} taskId
   * @returns
   */
  async fullSyncWarnDetailDownload(companyId: string, taskId: string): Promise<xlsx.WorkBook> {
    // 前置判断 全量同步任务 && 告警任务
    const taskDetail = await this.lasAdminService.findFullSyncTaskByTaskId(taskId, companyId)
    if (!taskDetail) {
      throw new Error(`未找到详情记录，taskId: ${taskId} companyId: ${companyId}`)
    }
    if (taskDetail.status !== FullSyncStatus.SYNC_DEL_WARN && taskDetail.status!== FullSyncStatus.SYNC_SCOPE_WARN) {
      throw new Error( `该任务状态非警告状态`)
    }

    // 获取三张表警告数据
    const userRecords = await this.lasAdminService.getUserRecordsByStatus(companyId, taskId, [RecordStatus.WARN])
    const deptRecords = await this.lasAdminService.getDeptRecordsByStatus(companyId, taskId, [RecordStatus.WARN])
    const deptUserRecords = await this.lasAdminService.getDeptUserRecordsByStatus(companyId, taskId, [RecordStatus.WARN])

    // 创建workbook
    const workbook = xlsx.utils.book_new()

    // 整合数据
    let data: IWarnDetailDownloadSheetHeader[] = []
    data = [
      WARN_DOWNLOAD_DETAIL_SHEET_HEADER,
      ...userRecords.map(item => {
        return {
          type: WARN_DOWNLOAD_DETAIL_TYPE_MAP.get('user'),
          name: item.name,
          account: item.account,
          thirdId: item.uid,
          deptPath: item.abs_path,
          result: '警告',
          syncOperation: FULL_SYNC_UPDATE_TYPE_MAP.get(item.update_type),
          errMsg: item.msg
        }
      }),
      ...deptRecords.map(item => {
        return {
          type: WARN_DOWNLOAD_DETAIL_TYPE_MAP.get('dept'),
          name: item.name,
          account: '',
          thirdId: item.did,
          deptPath: item.abs_path,
          result: '警告',
          syncOperation: FULL_SYNC_UPDATE_TYPE_MAP.get(item.update_type),
          errMsg: item.msg
        }
      }),
      ...deptUserRecords.map(item => {
        return {
          type: WARN_DOWNLOAD_DETAIL_TYPE_MAP.get('deptUser'),
          name: item.name,
          account: item.account,
          thirdId: item.uid,
          deptPath: item.abs_path,
          result: '警告',
          syncOperation: FULL_SYNC_UPDATE_TYPE_MAP.get(item.update_type),
          errMsg: item.msg
        }
      })
    ]

    // 创建sheet表，把数据添加进入sheet表里
    const worksheet = xlsx.utils.json_to_sheet(data, { skipHeader: true })
    // 将sheet加入到book中
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    return workbook
  }

  async getRollbackTaskIng(companyId: string) {
    const rollbackDetail = await this.lasAdminService.queryRollbackTaskIng(companyId)
    if (rollbackDetail.length <= 0) {
      return {
        taskId: ''
      }
    }
    return {
      taskId: rollbackDetail[0].task_id
    }
  }

}

export default new Admin()
