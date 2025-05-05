import {IDatabase} from "../../sdk/cognac/orm";
import {FullSyncTaskTable} from "../db/tables/FullSyncTask";
import {LasDepartmentIncrementTable, LasDeptIncrementSchema} from "../db/tables/LasDepartmentIncrement";
import {LasDepartmentUserIncrementTable, LasDeptUserIncrementSchema} from "../db/tables/LasDepartmentUserIncrement";
import {LasUserIncrementSchema, LasUserIncrementTable} from "../db/tables/LasUserIncrement";
import {FullSyncTaskStatisticsTable} from "../db/tables/FullSyncTaskStatistics";
import {SyncJobSettingTable} from "../db/tables/SyncJobSetting";
import { CompanyCfgTable } from "../companyCfg/CompanyCfgTable";
import {
  FullSyncStatus, FullSyncUpdateType,
  IncrementStatus,
  RecordStatus,
  SyncType
} from "../db/types";
import {IncrementScheduleTime, IncrementScheduleTimeSQL, ISuccessTaskSchedule, ISuccessTaskScheduleSQL} from "../admin/type";
import { ScheduleJobType } from "../schedule/ScheduleService";
import { FullSyncUserRecordTable } from "../db/tables/FullSyncUserRecord";
import { FullSyncDeptRecordTable } from "../db/tables/FullSyncDeptRecord";
import { FullSyncDeptUserRecordTable } from "../db/tables/FullSyncDeptUserRecord";
import { LocalAccountService } from "../../sdk/account";


class LasAdminService {
  private fullSyncTaskTable: FullSyncTaskTable
  private userIncrementTable: LasUserIncrementTable
  private departmentIncrementTable: LasDepartmentIncrementTable
  private departmentUserIncrementTable: LasDepartmentUserIncrementTable
  private fullSyncTaskStatisticsTable: FullSyncTaskStatisticsTable
  private syncJobSettingTable: SyncJobSettingTable
  private companyCfgTable: CompanyCfgTable
  private fullSyncUserRecordTable: FullSyncUserRecordTable
  private fullSyncDeptRecordTable: FullSyncDeptRecordTable
  private fullSyncDeptUserRecordTable: FullSyncDeptUserRecordTable
  private las: LocalAccountService

  init(collectDb: IDatabase, selfDb: IDatabase) {
    this.userIncrementTable = new LasUserIncrementTable(collectDb);
    this.departmentIncrementTable = new LasDepartmentIncrementTable(collectDb);
    this.departmentUserIncrementTable = new LasDepartmentUserIncrementTable(collectDb);
    this.fullSyncTaskTable = new FullSyncTaskTable(selfDb);
    this.fullSyncTaskStatisticsTable = new FullSyncTaskStatisticsTable(selfDb);
    this.syncJobSettingTable = new SyncJobSettingTable(selfDb);
    this.companyCfgTable = new CompanyCfgTable(collectDb);
    this.fullSyncUserRecordTable = new FullSyncUserRecordTable(selfDb);
    this.fullSyncDeptRecordTable = new FullSyncDeptRecordTable(selfDb);
    this.fullSyncDeptUserRecordTable = new FullSyncDeptUserRecordTable(selfDb);
    this.las = new LocalAccountService(collectDb)
  }

  async findFullSyncTaskByTaskId(taskId: string, companyId: string) {
    return this.fullSyncTaskTable.getTask(taskId, companyId)
  }

  async getFullSyncTasks(status: FullSyncStatus[], syncWay: SyncType[], offset: number, limit: number, companyId: string) {
    return this.fullSyncTaskTable.querySyncTasks(status, syncWay, offset, limit, companyId)
  }

  async getFullSyncTasksCount(status: FullSyncStatus[], syncWay: SyncType[], companyId: string) {
    return this.fullSyncTaskTable.querySyncTasksCount(status, syncWay, companyId)
  }

  async getFullSyncTaskDetail(taskId: string, companyId: string) {
    const data = await this.fullSyncTaskStatisticsTable.queryFullSyncTaskDetail(taskId, companyId)
    return data.data.rows
  }

  async checkTaskCanRun(id: number, companyId: string) {
    return this.fullSyncTaskTable.checkTaskCanRun(id, companyId)
  }

  async getLatestFullSyncTasksSuccessOrSyncIng(companyId: string, id: number) {
    return this.fullSyncTaskTable.queryLatestFullSyncTaskSuccessOrSyncIng(companyId, id)
  }

  async getLatestFullSyncTasksToSyncByAuto(companyId: string, id: number) {
    return this.fullSyncTaskTable.queryLatestFullSyncTaskToSyncByAuto(companyId, id)
  }

  async updateAllRetryFullSyncTaskStatusToCancel(companyId: string ) {
    return this.fullSyncTaskTable.updateAllRetryFullSyncTaskStatusToCancel(companyId)
  }

  async getDeptIncrementDetail(id: number, thirdCompanyId: string) {
    return this.departmentIncrementTable.getDeptIncrementDetail(id, thirdCompanyId)
  }

  async getUserIncrementDetail(id: number, thirdCompanyId: string) {
    return this.userIncrementTable.getUserIncrementDetail(id, thirdCompanyId)
  }

  async getDeptUserIncrementDetail(id: number, thirdCompanyId: string) {
    return this.departmentUserIncrementTable.getDeptUserIncrementDetail(id, thirdCompanyId)
  }

  async addIncrementUser(ovs: Partial<LasUserIncrementSchema>) {
    return this.userIncrementTable.addUser(ovs)
  }

  async addIncrementDept(ovs: Partial<LasDeptIncrementSchema>) {
    return this.departmentIncrementTable.addDeptIncrement(ovs)
  }

  async addIncrementDeptUser(ovs: Partial<LasDeptUserIncrementSchema>) {
    return this.departmentUserIncrementTable.addDeptUserIncrement(ovs)
  }

  async getIncrementSyncDeptList(syncWay: SyncType[], status: IncrementStatus[],offset: number, limit: number, thirdCompanyId: string, content: string | undefined, scheduleTime: IncrementScheduleTimeSQL | undefined) {
    return this.departmentIncrementTable.queryIncrementSyncDeptList(syncWay, status, offset, limit, thirdCompanyId, content, scheduleTime)
  }

  async getIncrementSyncDeptListCount(syncWay: SyncType[], status: IncrementStatus[], thirdCompanyId: string, content: string | undefined, scheduleTime: IncrementScheduleTimeSQL | undefined) {
    return this.departmentIncrementTable.queryIncrementSyncDeptListCount(syncWay, status, thirdCompanyId, content, scheduleTime)
  }

  async getIncrementSyncUserList(syncWay: SyncType[], status: IncrementStatus[],offset: number, limit: number, thirdCompanyId: string,  content: string | undefined, scheduleTime: IncrementScheduleTimeSQL | undefined) {
    return this.userIncrementTable.queryIncrementSyncUserList(syncWay, status, offset, limit, thirdCompanyId, content, scheduleTime)
  }

  async getIncrementSyncUserListCount(syncWay: SyncType[], status: IncrementStatus[], thirdCompanyId: string,  content: string | undefined, scheduleTime: IncrementScheduleTimeSQL | undefined) {
    return this.userIncrementTable.queryIncrementSyncUserListCount(syncWay, status, thirdCompanyId, content, scheduleTime)
  }

  async getIncrementSyncDeptUserList(syncWay: SyncType[], status: IncrementStatus[],offset: number, limit: number, thirdCompanyId: string, scheduleTime: IncrementScheduleTimeSQL | undefined) {
    return this.departmentUserIncrementTable.queryIncrementSyncDeptUserList(syncWay, status, offset, limit, thirdCompanyId, scheduleTime)
  }

  async getIncrementSyncDeptUserListCount(syncWay: SyncType[], status: IncrementStatus[], thirdCompanyId: string, scheduleTime: IncrementScheduleTimeSQL | undefined) {
    return this.departmentUserIncrementTable.queryIncrementSyncDeptUserListCount(syncWay, status, thirdCompanyId, scheduleTime)
  }

  async getSyncConfig(companyId: string, type: ScheduleJobType) {
    return this.syncJobSettingTable.getSyncConfig(companyId, type)
  }

  async getCompanyCfg(companyId: string) {
    return this.companyCfgTable.getCompanyCfg(companyId)
  }

  async getFullSyncSuccessTasks(companyId: string, offset: number, limit: number, content: string | undefined, scheduleTime: ISuccessTaskScheduleSQL) {
    return this.fullSyncTaskTable.queryFullSyncSuccessTasks(companyId, offset, limit, scheduleTime, content)
  }

  async getFullSyncSuccessTasksCount(company_id: string, content: string | undefined, scheduleTime: ISuccessTaskScheduleSQL) {
    return this.fullSyncTaskTable.queryFullSyncSuccessTasksCount(company_id, scheduleTime, content)

  }

  async getRollbackTasks(companyId: string, offset: number, limit: number) {
    return this.fullSyncTaskTable.queryRollbackTasks(companyId, offset, limit)
  }

  async getRollbackTasksCount(companyId: string) {
    return this.fullSyncTaskTable.queryRollbackTasksCount(companyId)
  }

  async getUserRecordsByStatus(companyId: string, taskId: string, status: RecordStatus[]) {
    return this.fullSyncUserRecordTable.queryRecordsByStatus(companyId, taskId, status)
  }

  async getDeptRecordsByStatus(companyId: string, taskId: string, status: RecordStatus[]) {
    return this.fullSyncDeptRecordTable.queryRecordsByStatus(companyId, taskId, status)
  }

  async queryDeptRecordsByStatusAndType(taskId: string, status: RecordStatus, updateType: FullSyncUpdateType) {
    return this.fullSyncDeptRecordTable.queryRecordsByStatusAndType(taskId, status, updateType)
  }

  async getDeptUserRecordsByStatus(companyId: string, taskId: string, status: RecordStatus[]) {
    return this.fullSyncDeptUserRecordTable.queryRecordsByStatus(companyId, taskId, status)
  }

  async countLasTaskData(taskId: string, thirdCompanyId: string) {
    return this.las.countLasTaskData(taskId, thirdCompanyId)
  }

  async queryRollbackTaskIng(companyId: string) {
    return this.fullSyncTaskTable.queryRollbackTaskByToSyncOrSyncing(companyId)
  }

}

export default new LasAdminService()
