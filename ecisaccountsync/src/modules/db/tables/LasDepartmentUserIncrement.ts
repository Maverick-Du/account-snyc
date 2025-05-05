/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"
import {IncrementStatus, SyncType, IncrementUpdateType} from "../types";
import { IncrementScheduleTimeSQL } from '../../admin/type';

export interface LasDeptUserIncrementSchema {
  id: number
  third_company_id: string
  platform_id: string
  uid: string
  did: string
  dids: string
  dids_order: string
  order: number
  main: number
  operator?: string
  sync_type?: SyncType,  //同步方式，auto/manual
  update_type: IncrementUpdateType,  //修改类型, user_dept_add/user_dept_del/user_dept_update
  status?: IncrementStatus,  //0-默认状态，1-已同步 -1:同步失败
  msg?: string,
  sync_time?: Date,
  ctime?: number,
  mtime?: number
}

export class LasDepartmentUserIncrementTable extends Table<LasDeptUserIncrementSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_las_department_user_increment')
  }

  async querySyncData(thirdCompanyId: string, startTime: string, endTime: string): Promise<LasDeptUserIncrementSchema[]> {
    return this.select('*')
        .where('sync_time >= ? and sync_time < ? and status <= 0 and third_company_id =?', startTime, endTime, thirdCompanyId)
        .orderBy('sync_time ASC')
        .query()
  }

  async countSyncData(thirdCompanyId: string, startTime: string, endTime: string) {
    return this.db.select('select count(1) as total from tb_las_department_user_increment where sync_time >= ? and sync_time < ? and status <= 0 and third_company_id =?', [startTime, endTime, thirdCompanyId])
  }

  async getMaxEndTime(thirdCompanyId: string, startTime: string, max: number) {
    let ret = await this.select('sync_time').where('sync_time >= ? and status <= 0 and third_company_id =?', startTime, thirdCompanyId).orderBy("sync_time ASC").limit(1, max - 1).query()
    if (!ret || ret.length <= 0) {
      return null
    }
    return ret[0].sync_time
  }

  async updateDeptUserIncrement(id: number, status: number, msg: string): Promise<string> {
    return this.update({
      status: status,
      msg: msg
    }).where('id=?', id).query()
  }

  async addDeptUserIncrement(ovs: Partial<LasDeptUserIncrementSchema>): Promise<number> {
    return this.add(ovs).query()
  }

  async getDeptUserIncrementDetail(id: number, thirdCompanyId: string): Promise<LasDeptUserIncrementSchema> {
    return this.get('id = ? and third_company_id = ?', id, thirdCompanyId).query()
  }

  async queryIncrementSyncDeptUserList(syncWay: SyncType[], status: IncrementStatus[], offset: number, limit: number, thirdCompanyId: string, scheduleTime: IncrementScheduleTimeSQL | undefined) {

    let where = ''
    if (!!scheduleTime) {
      where = `${where} mtime >= '${scheduleTime.startTime}' and mtime < '${scheduleTime.endTime}' and`
    }
    const syncWayIn = syncWay.join("', '")
    const statusIn = status.join(", ")
    where = `${where} sync_type in ('${syncWayIn}') and status in (${statusIn}) and third_company_id = '${thirdCompanyId}'`
    return this.select('id, third_company_id as company_id, uid, did, sync_type, update_type, operator, status, mtime').where(where).orderBy('id desc').limit(limit, offset * limit).query()
  }

  async queryIncrementSyncDeptUserListCount(syncWay: SyncType[], status: IncrementStatus[], thirdCompanyId: string, scheduleTime: IncrementScheduleTimeSQL | undefined): Promise<number> {
    let where = ''
    if (!!scheduleTime) {
      where = `${where} mtime >= '${scheduleTime.startTime}' and mtime < '${scheduleTime.endTime}' and`
    }
    const syncWayIn = syncWay.join("', '")
    const statusIn = status.join(", ")
    where = `${where} sync_type in ('${syncWayIn}') and status in (${statusIn}) and third_company_id = '${thirdCompanyId}'`
    const countList: any[] = await this.select('count(*) as count').where(where).query()
    return countList[0].count
  }

  async deleteDataByTime(time: string) {
    return this.remove('sync_time < ?', time).query()
  }

  async countData() {
    return this.db.select('select count(1) as total from tb_las_department_user_increment', [])
  }

  async getOlderTime() {
    let ret = await this.select('sync_time').orderBy('sync_time ASC').limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return null
    }
    return ret[0].sync_time as any
  }

}
