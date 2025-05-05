import {IDatabase} from "../../sdk/cognac/orm";
import { FullSyncTaskTable } from "../db/tables/FullSyncTask"
import { FullSyncTaskStatisticsTable } from "../db/tables/FullSyncTaskStatistics"
import { LASDepartmentTable, LASDepartmentUserTable, LASUserTable, LocalAccountService, LocalAccountSystem } from "../../sdk/account"
import { FullSyncUserRecordTable } from "../db/tables/FullSyncUserRecord"
import { FullSyncDeptRecordTable } from "../db/tables/FullSyncDeptRecord"
import { FullSyncDeptUserRecordTable } from "../db/tables/FullSyncDeptUserRecord"
import { FullSyncErrAnalyseRecord, FullSyncErrAnalyseRecordTable } from "../db/tables/FullSyncErrAnalyseRecord"
import { FullSyncTaskAnalyse, FullSyncTaskAnalyseTable } from "../db/tables/FullSyncTaskAnalyse"
import { FullSyncMidAnalyseRecord, FullSyncMidAnalyseRecordTable } from "../db/tables/FullSyncMidAnalyseRecord"
import { AnalyseListOvs, FullSyncStatisticAnalyseStatus, FullSyncUpdateType, RecordStatus, StatisticAnalyseOperateType } from "../db/types"
import { lockService } from "../lock/"
import { AnalyseStopEntity, AnalyseTaskStopError } from "../full_sync_statistic_analyse/strategy/type"

class FullSyncStatisticAnalyseSrv {
  private db: IDatabase
  private lockService = lockService
  private fullSyncTaskTable: FullSyncTaskTable
  private fullSyncTaskStatisticsTable: FullSyncTaskStatisticsTable
  private lasDepartmentTable: LASDepartmentTable
  private lasUserTable: LASUserTable
  private lasDepartmentUserTable: LASDepartmentUserTable
  private FullSyncUserRecordTable: FullSyncUserRecordTable
  private fullSyncDeptRecordTable: FullSyncDeptRecordTable
  private fullSyncDeptUserRecordTable: FullSyncDeptUserRecordTable
  private fullSyncTaskAnalyseTable: FullSyncTaskAnalyseTable
  private fullSyncErrAnalyseRecordTable: FullSyncErrAnalyseRecordTable
  private fullSyncMidAnalyseRecordTable: FullSyncMidAnalyseRecordTable
  private stopMap: Map<string, AnalyseStopEntity> = new Map()
  private lasSystem: LocalAccountSystem

  init(collectDb: IDatabase, selfDb: IDatabase) {
    this.fullSyncTaskTable = new FullSyncTaskTable(selfDb)
    this.fullSyncTaskStatisticsTable = new FullSyncTaskStatisticsTable(selfDb)
    this.lasDepartmentTable = new LASDepartmentTable(collectDb)
    this.lasUserTable = new LASUserTable(collectDb)
    this.lasDepartmentUserTable = new LASDepartmentUserTable(collectDb)
    this.FullSyncUserRecordTable = new FullSyncUserRecordTable(selfDb)
    this.fullSyncDeptRecordTable = new FullSyncDeptRecordTable(selfDb)
    this.fullSyncDeptUserRecordTable = new FullSyncDeptUserRecordTable(selfDb)
    this.fullSyncTaskAnalyseTable = new FullSyncTaskAnalyseTable(selfDb)
    this.fullSyncErrAnalyseRecordTable = new FullSyncErrAnalyseRecordTable(selfDb)
    this.fullSyncMidAnalyseRecordTable = new FullSyncMidAnalyseRecordTable(selfDb)
    let lasService = new LocalAccountService(collectDb)
    this.lasSystem = new LocalAccountSystem(lasService)
  }

  stopStisticAnalyse(analyseEntity: AnalyseStopEntity) {
    this.stopMap.set(`${analyseEntity.taskId}_${analyseEntity.companyId}`, analyseEntity)
  }

  checkStatisticAnalyseIdNeedStop(taskId: string, companyId: string) {
    let key = `${taskId}_${companyId}`
    let ananlyseEntity = this.stopMap.get(key)
    if (ananlyseEntity) {
      this.stopMap.delete(key)
      throw new AnalyseTaskStopError(taskId, ananlyseEntity.name, ananlyseEntity.message)
    }
  }

  clearStatisticAnalyse(taskId: string, companyId: string) {
    this.stopMap.delete(`${taskId}_${companyId}`)
  }


  async clearAllInterruptAnalyse() {
    // 针对程序终端导致的仍处于执行中的统计分析任务，清除掉
    await this.fullSyncTaskAnalyseTable.clearAnalyse()
  }

  /**
  * 统计分析状态表添加记录
  * 其中 ovs 为 FullSyncTaskAnalyse 类型的对象
  * ovs中status状态已定义  为  FullSyncStatisticAnalyseStatus
  */
  async addFullSyncTaskAnalyseRecord(ovs: Partial<FullSyncTaskAnalyse>): Promise<number> {
    return this.fullSyncTaskAnalyseTable.addAnalyse(ovs)
  }

  /**
   * @description 获取统计分析状态表记录
   * @param company_id
   * @param task_id
   * @returns 统计分析任务记录
   */
  async getFullSyncTaskAnalyseRecord(company_id: string, task_id: string): Promise<FullSyncTaskAnalyse> {
    return this.fullSyncTaskAnalyseTable.getAnalyse(company_id, task_id)
  }

  /**
   * @description 更新统计分析状态表status
   * @param company_id string
   * @param task_id string
   * @param status FullSyncStatisticAnalyseStatus
   * @returns string
   */
  async updateFullSyncTaskAnalyseRecord(company_id: string, task_id: string, status: FullSyncStatisticAnalyseStatus, msg?: string): Promise<string> {
    return this.fullSyncTaskAnalyseTable.updateAnalyse(company_id, task_id, { status, err_msg: msg })
  }

  /**
   * 统计分析中间表添加记录
   * @param ovs FullSyncMidAnalyseRecord
   * @returns number
   */
  async addFullSyncMidAnalyseRecord(ovs: Partial<FullSyncMidAnalyseRecord>): Promise<number> {
    return this.fullSyncMidAnalyseRecordTable.addAnalyse(ovs)
  }

  /**
   * 获取统计分析中间表记录
   * @param company_id
   * @param task_id
   * @returns FullSyncMidAnalyseRecord
   */
  async getFullSyncMidAnalyseRecord(company_id: string, task_id: string): Promise<FullSyncMidAnalyseRecord> {
    return this.fullSyncMidAnalyseRecordTable.getAnalyse(company_id, task_id)
  }

  /**
   * 统计分析错误记录表添加记录
   * @param ovs FullSyncErrAnalyseRecord
   * @returns number
   */
  async addFullSyncErrAnalyseRecord(ovs: Partial<FullSyncErrAnalyseRecord>): Promise<number> {
    return this.fullSyncErrAnalyseRecordTable.addAnalyse(ovs)
  }

  /**
   * 获取统计分析错误记录表记录列表
   * @param company_id string
   * @param task_id string
   * @param offset number
   * @param limit number
   * @param ovs AnalyseListOvs
   * @returns FullSyncErrAnalyseRecord[]
   */
  async getFullSyncErrAnalyseRecordList(company_id: string, task_id: string, offset: number, limit: number, ovs: AnalyseListOvs): Promise<FullSyncErrAnalyseRecord[]> {
    return this.fullSyncErrAnalyseRecordTable.getAnalyseList(company_id, task_id, offset, limit, ovs)
  }

  /**
 * 获取所有统计分析错误记录表记录列表
 * @param company_id string
 * @param task_id string
 * @returns FullSyncErrAnalyseRecord[]
 */
  async getFullSyncErrAnalyseAllRecordList(company_id: string, task_id: string): Promise<FullSyncErrAnalyseRecord[]> {
    return this.fullSyncErrAnalyseRecordTable.getAllAnalyseList(company_id, task_id)
  }

  /**
   * 获取统计分析错误记录表记录数
   * @param company_id string
   * @param task_id string
   * @param ovs AnalyseListOvs
   * @returns number
   */
  async getFullSyncErrAnalyseRecordCount(company_id: string, task_id: string, ovs: AnalyseListOvs): Promise<number> {
    return this.fullSyncErrAnalyseRecordTable.getAnalyseListCount(company_id, task_id, ovs)
  }

  /**
   * @description 查询全量同步任务数据详情表信息 tb_full_sync_task_statistics表
   * @param company_id string
   * @param task_id string
   * @returns FullSyncTaskStatisticsSchema
   */
  async getFullSyncTaskStatistics(company_id: string, task_id: string) {
    return this.fullSyncTaskStatisticsTable.querySyncData(task_id, company_id)
  }

  async getFullSyncUserRecordList(taskId: string, offset: number, limit: number, status: RecordStatus, updateType?: FullSyncUpdateType, errType?: string, content?: string) {
    return this.FullSyncUserRecordTable.queryRecordList(taskId, offset, limit, status, updateType, errType, content)
  }

  async getFullSyncUserRecordListCount(taskId: string, status: RecordStatus, updateType?: FullSyncUpdateType, errType?: string, content?: string) {
    return this.FullSyncUserRecordTable.queryRecordListCount(taskId, status, updateType, errType, content)
  }

  async getFullSyncDeptRecordList(taskId: string, offset: number, limit: number, status: RecordStatus, updateType?: FullSyncUpdateType, errType?: string, content?: string) {
    return this.fullSyncDeptRecordTable.queryRecordList(taskId, offset, limit, status, updateType, errType, content)
  }

  async getFullSyncDeptRecordListCount(taskId: string, status: RecordStatus, updateType?: FullSyncUpdateType, errType?: string, content?: string) {
    return this.fullSyncDeptRecordTable.queryRecordListCount(taskId, status, updateType, errType, content)
  }

  async getFullSyncDeptUserRecordList(taskId: string, offset: number, limit: number, status: RecordStatus, updateType?: FullSyncUpdateType, errType?: string, content?: string) {
    return this.fullSyncDeptUserRecordTable.queryRecordList(taskId, offset, limit, status, updateType, errType, content)
  }

  async getFullSyncDeptUserRecordListCount(taskId: string, status: RecordStatus, updateType?: FullSyncUpdateType, errType?: string, content?: string) {
    return this.fullSyncDeptUserRecordTable.queryRecordListCount(taskId, status, updateType, errType, content)
  }

  async getAnalyseDeptRecordsByStatusAndType(taskId: string, status: RecordStatus, updateType: FullSyncUpdateType) {
    // return this.fullSyncDeptRecordTable.getAnalyseRecordsByStatusAndType(taskId, status, updateType)
    return this.pageIt(-1, 0, async (limit, offset) => {
      return this.fullSyncDeptRecordTable.queryRecordList(taskId, offset, limit, status, updateType)
    })
  }

  async getAnalyseUserRecordsByStatusAndType(taskId: string, status: RecordStatus, updateType: FullSyncUpdateType) {
    // return this.FullSyncUserRecordTable.getAnalyseRecordsByStatusAndType(taskId, status, updateType)
    return this.pageIt(-1, 0, async (limit, offset) => {
      return this.FullSyncUserRecordTable.queryRecordList(taskId, offset, limit, status, updateType)
    })
  }

  async getListDepartments(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
    return this.lasSystem.listDepartments(taskId, thirdCompanyId, platformId, did)
    // return this.pageIt(-1, 0, (limit, offset) => {
    //   return this.lasDepartmentTable.listByParentId(taskId, thirdCompanyId, platformId, did, offset, limit) as Promise<DepartmentSchema[]>
    // })
  }

  async getFullSyncTaskByTaskId(taskId: string, companyId: string) {
    return this.fullSyncTaskTable.getTask(taskId, companyId)
  }

  async getDeptUserMinOrMaxId(taskId: string, thirdCompanyId: string, platformId: string, order: string): Promise<number> {
    return await this.lasDepartmentUserTable.getDeptUerMinOrMaxId(taskId, thirdCompanyId, platformId, order)
  }

  // 中间表统计分析
  async getUserMinOrMaxIdByMidTable(taskId: string, third_company_id: string, order: string) {
    return this.lasUserTable.getUserMinOrMaxIdByMidTable(taskId, third_company_id, order)
  }

  async getDeptUserMinOrMaxIdByMidTable(taskId: string, third_company_id: string, order: string) {
    return this.lasDepartmentUserTable.getDeptUserMinOrMaxIdByMidTable(taskId, third_company_id, order)
  }

  async getDeptMinOrMaxIdByMidTable(taskId: string, third_company_id: string, order: string) {
    return this.lasDepartmentTable.getDeptMinOrMaxIdByMidTable(taskId, third_company_id, order)
  }

  async pageQueryDeptUsers(taskId: string, thirdCompanyId: string, platformId: string, startId: number, endId: number) {
    return this.lasSystem.pageQueryDeptUsers(taskId, thirdCompanyId, platformId, startId, endId)
  }

  // 获取用户所有数据
  async pageQueryUsersByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number) {
    return this.lasSystem.pageQueryUsersByMidTable(taskId, thirdCompanyId, startId, endId)
  }

  // 获取部门所有数据
  async pageQueryDeptsByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number) {
    return this.lasSystem.pageQueryDeptsByMidTable(taskId, thirdCompanyId, startId, endId)
  }

  // 获取部门用户关系所有数据
  async pageQueryDeptUsersByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number) {
    return this.lasSystem.pageQueryDeptUsersByMidTable(taskId, thirdCompanyId, startId, endId)
  }

  // 查询部门记录表中失败类型数量
  async queryDeptAnalyseRecordErrCount(taskId: string, updateType: StatisticAnalyseOperateType, errType: string) {
    return this.fullSyncDeptRecordTable.queryAnalyseRecordErrCount(taskId, updateType, errType)
  }

  // 查询用户记录表中失败类型数量
  async queryUserAnalyseRecordErrCount(taskId: string, updateType: StatisticAnalyseOperateType, errType: string) {
    return this.FullSyncUserRecordTable.queryAnalyseRecordErrCount(taskId, updateType, errType)
  }

  // 查询部门用户记录表中失败类型数量
  async queryDeptUserAnalyseRecordErrCount(taskId: string, updateType: StatisticAnalyseOperateType, errType: string) {
    return this.fullSyncDeptUserRecordTable.queryAnalyseRecordErrCount(taskId, updateType, errType)
  }

  private async pageIt<T>(
    limit: number,
    offset: number,
    func: { (limit: number, offset: number): Promise<T[]> }
  ) {
    const start = offset
    const end = limit > 0 ? offset + limit : -1
    let items: T[] = []
    for (let i = start; i < end || end === -1; i += 1000) {
      const l = end > 0 ? (end - i < 1000 ? end - i : 1000) : 1000
      const ret = await func(l, i)
      if (ret.length === 0) break
      items = items.concat(ret)
    }
    return items
  }

  private async pageItById<T>(
    startId: number,
    endId: number,
    func: { (s: number, e: number): Promise<T[]> }
  ) {
    const start = startId
    let items: T[] = []
    for (let i = start; i < endId; i += 1000) {
      const end = i + 1000 >= endId ? endId + 1 : i + 1000
      const ret = await func(i, end)
      if (Array.isArray(ret) && ret.length > 0) {
        items = items.concat(ret)
      }
    }
    return items
  }
}

const fullSyncStatisticAnalyseSrv = new FullSyncStatisticAnalyseSrv()
export {
  FullSyncStatisticAnalyseSrv,
  fullSyncStatisticAnalyseSrv
}
