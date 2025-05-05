/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"
import {IncrementStatus, SyncType, IncrementUpdateType, SourceType} from "../types";
import { IncrementScheduleTimeSQL } from '../../admin/type';

export interface LasDeptIncrementSchema {
  id:number
  did: string
  pid: string
  third_company_id: string
  platform_id: string
  name: string
  order: number
  source: SourceType,
  operator?: string,
  sync_type?: SyncType,  //同步方式，auto/manual
  update_type: IncrementUpdateType,  //修改类型, dept_del/dept_update/dept_add/dept_move
  status?: IncrementStatus,  //0-默认状态，1-已同步 -1:同步失败
  msg?: string,
  sync_time?: Date,
  type?: string
  ctime?: number
  mtime?: number
}

export class LasDepartmentIncrementTable extends Table<LasDeptIncrementSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_las_department_increment')
  }

  async querySyncData(thirdCompanyId: string, startTime: string, endTime: string): Promise<LasDeptIncrementSchema[]> {
    return this.select('*')
        .where('sync_time >= ? and sync_time < ? and status <= 0 and third_company_id =?', startTime, endTime, thirdCompanyId)
        .orderBy('sync_time ASC')
        .query()
  }

  async countSyncData(thirdCompanyId: string, startTime: string, endTime: string) {
    return this.db.select('select count(1) as total from tb_las_department_increment where sync_time >= ? and sync_time < ? and status <= 0 and third_company_id =?', [startTime, endTime, thirdCompanyId])
  }

  async getMaxEndTime(thirdCompanyId: string, startTime: string, max: number) {
    let ret = await this.select('sync_time').where('sync_time >= ? and status <= 0 and third_company_id =?', startTime, thirdCompanyId).orderBy("sync_time ASC").limit(1, max - 1).query()
    if (!ret || ret.length <= 0) {
      return null
    }
    return ret[0].sync_time
  }

  async updateDeptIncrement(id: number, status: IncrementStatus, msg: string): Promise<string> {
    return this.update({
      status: status,
      msg: msg
    }).where('id=?', id).query()
  }

  async addDeptIncrement(ovs: Partial<LasDeptIncrementSchema>): Promise<number> {
    return this.add(ovs).query()
  }

  async getDeptIncrementDetail(id: number, thirdCompanyId: string): Promise<LasDeptIncrementSchema> {
    return this.get('id = ? and third_company_id = ?', id, thirdCompanyId).query()
  }

  async queryIncrementSyncDeptList(syncWay: SyncType[], status: IncrementStatus[], offset: number, limit: number, thirdCompanyId: string, content: string | undefined, scheduleTime: IncrementScheduleTimeSQL | undefined): Promise<LasDeptIncrementSchema[]> {
    let whereClauses: string[] = []
    if (!!content) {
      whereClauses.push(`name like ?`)
      content = `${content}%`
    }
    if (!!scheduleTime) {
      whereClauses.push(`mtime >= ? and mtime < ?`)
    }
    const syncWayIn = syncWay.map(() => '?').join(', ');
    const statusIn = status.map(() => '?').join(', ');

    whereClauses.push(`sync_type in (${syncWayIn})`);
    whereClauses.push(`status in (${statusIn})`);
    whereClauses.push(`third_company_id = ?`);

    const wheres = whereClauses.join(' and ')

    const params = [
      ...(content ? [content] : []),
      ...(scheduleTime ? [scheduleTime.startTime, scheduleTime.endTime] : []),
      ...syncWay,
      ...status,
      thirdCompanyId,
    ];

    return this.select('id, third_company_id as company_id, did as dept_id, name as dept_name, mtime, operator, status, sync_type, update_type').where(wheres, ...params).orderBy('id desc').limit(limit, offset * limit).query()
  }

  async queryIncrementSyncDeptListCount(syncWay: SyncType[], status: IncrementStatus[], thirdCompanyId: string, content: string | undefined, scheduleTime: IncrementScheduleTimeSQL | undefined): Promise<number> {
    let whereClauses: string[] = []
    let where = ''
    if (!!content) {
      whereClauses.push(`name like ?`)
      content =  `${content}%`
    }
    if (!!scheduleTime) {
      whereClauses.push(`mtime >= ? and mtime < ?`)
    }

    const syncWayIn = syncWay.map(() => '?').join(', ');
    const statusIn = status.map(() => '?').join(', ');

    whereClauses.push(`sync_type in (${syncWayIn})`);
    whereClauses.push(`status in (${statusIn})`);
    whereClauses.push(`third_company_id = ?`);

    const wheres = whereClauses.join(' and ');

    const params = [
      ...(content ? [content] : []),
      ...(scheduleTime ? [scheduleTime.startTime, scheduleTime.endTime] : []),
      ...syncWay,
      ...status,
      thirdCompanyId,
    ];
    const countList: any[] = await  this.select('count(*) as count').where(wheres, ...params).query()
    return countList[0].count
  }

  async deleteDataByTime(time: string) {
    return this.remove('sync_time < ?', time).query()
  }

  async countData() {
    return this.db.select('select count(1) as total from tb_las_department_increment', [])
  }

  async getOlderTime() {
    let ret = await this.select('sync_time').orderBy('sync_time ASC').limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return null
    }
    return ret[0].sync_time as any
  }
}
