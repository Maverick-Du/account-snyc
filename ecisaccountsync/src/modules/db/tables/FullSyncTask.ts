/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"
import {FullSyncStatus, SyncType} from "../types";
import { ISuccessTaskScheduleSQL } from '../../admin/type';

export interface FullSyncTaskSchema {
  id?: number,
  task_id?: string,
  company_id?: string,
  sync_type?: SyncType,
  status: FullSyncStatus,
  scope_version?: number,
  operator?: string,
  collect_cost?: number,
  error_msg?: string,
  region_id: string,
  schedule_time?: Date,
  begin_time?: Date
  end_time?: Date
  ctime?: Date
  mtime?: Date
}

export class FullSyncTaskTable extends Table<FullSyncTaskSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_full_sync_task')
  }

  async queryLatestFullSyncTaskSuccessOrSyncIng(companyId: string, id: number): Promise<FullSyncTaskSchema[]> {
    return this.select('1').where('company_id = ? and id > ? and status in (?, ?)', companyId, id, FullSyncStatus.SYNC_ING, FullSyncStatus.SYNC_SUCCESS).orderBy('id asc').limit(1, 0).query()
  }

  async queryLatestFullSyncTaskToSyncByAuto(companyId: string, id: number): Promise<FullSyncTaskSchema[]> {
    return this.select('1').where('company_id = ? and id > ? and sync_type = ? and status in (?)', companyId, id, SyncType.AUTO, FullSyncStatus.TO_SYNC).orderBy('id asc').limit(1, 0).query()
  }

  async queryLatestRetryFullSyncTask(companyId: string, taskId: string): Promise<FullSyncTaskSchema>  {
    const taskArr = await this.select('*').where("task_id like '" + taskId + "%' and company_id = ?", companyId).orderBy('id desc').limit(1, 0).query()
    return taskArr.length > 0 ? taskArr[0] : null
  }

  async updateAllRetryFullSyncTaskStatusToCancel(companyId: string): Promise<string> {
    return this.update({
      status: -10
    }).where('status = ? and sync_type = ? and company_id = ?',FullSyncStatus.TO_SYNC, SyncType.MANUAL, companyId).query()
  }

  async querySuccessFullSyncTaskEndTime(thirdCompanyId: string): Promise<FullSyncTaskSchema[]> {
    return this.select('end_time').where('status = ? and company_id = ?', FullSyncStatus.SYNC_SUCCESS, thirdCompanyId).orderBy('end_time desc').limit(1, 0).query()
  }

  async querySyncTasks(status: FullSyncStatus[], syncWay: SyncType[], offset: number, limit: number, companyId: string) {
    const statusIn = status.join(',')
    const syncWayIn = "'" + syncWay.join("', '") + "'"
    const newOffset = offset * limit
    return this.db.select('select a.*, total_user, sync_user, total_dept, sync_dept, total_success, total_error from tb_full_sync_task a left join tb_full_sync_task_statistics b on a.task_id = b.task_id where a.status in (' + statusIn + ') and a.sync_type in (' + syncWayIn + ') and a.company_id = ' + companyId + ' order by a.id desc limit ' + limit + ' offset ' + newOffset, [])
  }

  async querySyncTasksCount(status: FullSyncStatus[], syncWay: SyncType[], companyId: string): Promise<number> {
    const statusIn = status.join(',')
    const syncWayIn = "'" + syncWay.join("', '") + "'"
    const countList: any[] = await this.select('count(*) as count').where('status in (' + statusIn + ') and sync_type in (' + syncWayIn + ') and company_id = ?', companyId).orderBy('id DESC').query()
    return countList[0].count
  }

  async addTask(ovs: Partial<FullSyncTaskSchema>): Promise<number> {
    return this.add(ovs).query()
  }

  async querySyncingTask(): Promise<FullSyncTaskSchema> {
    return this.get('status = ?', FullSyncStatus.SYNC_ING).query()
  }

  async getTask(taskId: string, companyId: string) {
    return this.get('task_id=? and company_id=?', taskId, companyId).query()
  }

  async getLatestToSyncTask(companyId: string) {
    let arr = await this.select('*').where('company_id=? and status =?', companyId, FullSyncStatus.TO_SYNC).orderBy('id desc').limit(1, 0).query()
    if (arr && arr.length > 0) {
      return arr[0]
    }
    return null
  }

  async getLatestTask(companyId: string) {
    let arr = await this.select('*').where('company_id=?', companyId).orderBy('id desc').limit(1, 0).query()
    if (arr && arr.length > 0) {
      return arr[0]
    }
    return null
  }

  async cancelTask(taskId: string, companyId: string, msg: string): Promise<number> {
    let res: any = await this.update({
      status: FullSyncStatus.SYNC_CANCEL,
      error_msg: msg
    }).where('task_id=? and company_id=? and status =?', taskId, companyId, FullSyncStatus.TO_SYNC).query()
    return res.affectedRows
  }

  async resetTask(taskId: string, companyId: string, operator: string): Promise<number> {
    let res: any = await this.update({
      status: FullSyncStatus.TO_SYNC,
      operator: operator,
      error_msg: null
    }).where('task_id=? and company_id=? and status in (?, ?)', taskId, companyId, FullSyncStatus.SYNC_SCOPE_WARN, FullSyncStatus.SYNC_DEL_WARN).query()
    return res.affectedRows
  }

  async failAllSyncingTask(regionId: string, msg: string) {
    return this.update({
      status: FullSyncStatus.SYNC_FAIL,
      end_time: new Date(),
      error_msg: msg
    }).where('status =? and region_id = ?', FullSyncStatus.SYNC_ING, regionId).query()
  }

  async startTask(taskId: string, companyId: string, beginTime: Date, regionId: string): Promise<number> {
    let res: any = await this.update({
      status: FullSyncStatus.SYNC_ING,
      begin_time: beginTime,
      region_id: regionId
    } as FullSyncTaskSchema).where('task_id=? and company_id=? and status = ?', taskId, companyId, FullSyncStatus.TO_SYNC).query()
    return res.affectedRows
  }

  async endTask(taskId: string, companyId: string, status: FullSyncStatus, endTime: Date, msg: string, scopeVersion: number) {
    return this.update({
      status: status,
      scope_version: scopeVersion,
      end_time: endTime,
      error_msg: msg
    } as FullSyncTaskSchema).where('task_id=? and company_id=? and status =?', taskId, companyId, FullSyncStatus.SYNC_ING).query()
  }

  async checkContinueTask(originId: number, companyId: string) {
    return this.select('*').where(
        'id > ? and company_id=? and status in (?, ?)',
        originId, companyId, FullSyncStatus.SYNC_ING, FullSyncStatus.SYNC_SUCCESS
    ).query()
  }

  async checkRetryTaskCanRun(originId: number, companyId: string, id: number) {
    return this.select('*').where(
        "id > ? and id < ? and company_id=? and status != ?",
        originId, id, companyId, FullSyncStatus.SYNC_CANCEL
    ).query()
  }

  async checkTaskCanRun(id: number, companyId: string) {
    return this.select('*').where(
        "id > ? and company_id=? and status != ?",
        id, companyId, FullSyncStatus.SYNC_CANCEL
    ).query()
  }

  async cancelBeforeTask(id: number, companyId: string, msg: string) {
    return this.update({
      status: FullSyncStatus.SYNC_CANCEL,
      error_msg: msg
    } as FullSyncTaskSchema).where('id < ? and company_id=? and status in (?, ?, ?)', id, companyId, FullSyncStatus.TO_SYNC, FullSyncStatus.SYNC_DEL_WARN, FullSyncStatus.SYNC_SCOPE_WARN).query()
  }

  async queryFullSyncSuccessTasks(companyId: string, offset: number, limit: number, scheduleTime: ISuccessTaskScheduleSQL, content: string | undefined) {
    let whereClauses: string[] = []
    if (!!content) {
      whereClauses.push('a.task_id like ?')
      content = `${content}%`
    }
    if (!!scheduleTime) {
      whereClauses.push('begin_time >= ? and end_time <= ?')
    }

    whereClauses.push('a.company_id = ?')
    whereClauses.push('a.status = ?')

    let wheres = whereClauses.join(' and ')

    const params = [
      ...(content ? [content] : []),
      ...(scheduleTime ? [scheduleTime.startTime, scheduleTime.endTime] : []),
      companyId,
      FullSyncStatus.SYNC_SUCCESS
    ]
    const newOffset = offset * limit
    return this.db.select('select a.task_id, a.id, a.company_id, a.sync_type, a.status, a.begin_time, b.total_success, b.total_error from tb_full_sync_task a left join tb_full_sync_task_statistics b on a.task_id = b.task_id where ' + wheres + ' order by a.id desc limit '+ limit +' offset ' + newOffset, params)
  }

  async queryFullSyncSuccessTasksCount(companyId: string, scheduleTime: ISuccessTaskScheduleSQL, content: string | undefined) : Promise<number> {
    let whereClauses: string[] = []
    if (!!content) {
      whereClauses.push('task_id like ?')
      content = `${content}%`
    }
    if (!!scheduleTime) {
      whereClauses.push('begin_time >= ? and end_time <= ?')
    }

    whereClauses.push('company_id = ?')
    whereClauses.push('status = ?')

    let wheres = whereClauses.join(' and ')

    const params = [
      ...(content ? [content] : []),
      ...(scheduleTime ? [scheduleTime.startTime, scheduleTime.endTime] : []),
      companyId,
      FullSyncStatus.SYNC_SUCCESS
    ]

    const countList: any[] = await this.select('count(*) as count').where(wheres, ...params).query()
    return countList[0].count
  }

  async queryRollbackTasks(companyId: string, offset: number, limit: number) {
    const newOffset = offset * limit
    return this.db.select('select a.task_id, a.operator, a.begin_time, b.total_user, b.total_dept, b.total_dept_user from tb_full_sync_task a left join tb_full_sync_task_statistics b on a.task_id = b.task_id where a.company_id = ' + companyId + ' and sync_type = \'' + SyncType.ROLLBACK + '\' order by a.id desc limit ' + limit + ' offset ' + newOffset, [])
  }

  async queryRollbackTasksCount(companyId: string): Promise<number> {
    const countList: any[] = await this.select('count(*) as count').where('company_id =? and sync_type = ?', companyId, SyncType.ROLLBACK).query()
    return countList[0].count
  }

  async queryRollbackTaskByToSyncOrSyncing(companyId: string) {
    return this.select('task_id, sync_type, status').where('company_id = ? and sync_type = ? and status in (?, ?)', companyId, SyncType.ROLLBACK, FullSyncStatus.TO_SYNC, FullSyncStatus.SYNC_ING).orderBy('id desc').limit(1, 0).query()
  }
}
