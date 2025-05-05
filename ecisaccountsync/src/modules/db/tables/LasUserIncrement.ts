/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"
import {IncrementStatus, SyncType, IncrementUpdateType, SourceType} from "../types";
import { IncrementScheduleTimeSQL } from '../../admin/type';


export interface LasUserIncrementSchema {
  id: number
  third_company_id: string
  platform_id: string,
  uid: string,
  def_did: string,
  def_did_order: number,
  account: string, // 登录名，对应account
  nick_name : string, // 用户昵称，对应nick_name
  password : string, // 密码
  avatar : string, // 头像
  email : string, // 邮箱
  gender : string, // 用户性别
  title : string, // 职称
  work_place : string, // 办公地点
  leader : string, // 上级主管ID
  employer : string, // 员工工号
  employment_status : string, // 就职状态[active, notactive, dismission, disabled]
  employment_type? : string, // 就职类型[permanent, intern]
  phone? :string, // 手机号
  telephone? :string, // 座机号
  source?: SourceType,
  custom_fields?: string,
  operator?: string,
  sync_type?: SyncType,  //同步方式，auto/manual
  update_type: IncrementUpdateType,  //修改类型, user_del/user_update/user_add
  status?: IncrementStatus,  //0-默认状态，1-已同步 -1:同步失败
  msg?: string,

  sync_time?: Date,
  ctime?:number,
  mtime?:number
}

export class LasUserIncrementTable extends Table<LasUserIncrementSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_las_user_increment')
  }

  async querySyncData(thirdCompanyId: string, startTime: string, endTime: string): Promise<LasUserIncrementSchema[]> {
    return this.select('*')
        .where('sync_time >= ? and sync_time < ? and status <= 0 and third_company_id =?', startTime, endTime, thirdCompanyId)
        .orderBy('sync_time ASC')
        .query()
  }

  async countSyncData(thirdCompanyId: string, startTime: string, endTime: string) {
    return this.db.select('select count(1) as total from tb_las_user_increment where sync_time >= ? and sync_time < ? and status <= 0 and third_company_id =?', [startTime, endTime, thirdCompanyId])
  }

  async getMaxEndTime(thirdCompanyId: string, startTime: string, max: number) {
    let ret = await this.select('sync_time').where('sync_time >= ? and status <= 0 and third_company_id =?', startTime, thirdCompanyId).orderBy("sync_time ASC").limit(1, max - 1).query()
    if (!ret || ret.length <= 0) {
      return null
    }
    return ret[0].sync_time
  }

  async updateUser(id: number, status: number, msg: string): Promise<string> {
    return this.update({
      status: status,
      msg: msg
    }).where('id=?', id).query()
  }

  async addUser(ovs: Partial<LasUserIncrementSchema>): Promise<number> {
    return this.add(ovs).query()
  }

  async getUserIncrementDetail(id: number, thirdCompanyId: string): Promise<LasUserIncrementSchema> {
    return this.get('id = ? and third_company_id = ?', id, thirdCompanyId).query()
  }

  async queryIncrementSyncUserList(syncWay: SyncType[], status: IncrementStatus[], offset: number, limit: number, thirdCompanyId: string, content: string | undefined, scheduleTime: IncrementScheduleTimeSQL | undefined): Promise<LasUserIncrementSchema[]> {
    let whereClauses: string[] = []
    if (!!content) {
      whereClauses.push(`nick_name like ?`)
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

    const wheres = whereClauses.join(' and ');

    const params = [
      ...(content ? [content] : []),
      ...(scheduleTime ? [scheduleTime.startTime, scheduleTime.endTime] : []),
      ...syncWay,
      ...status,
      thirdCompanyId,
    ];

    return this.select('id, third_company_id as company_id, account, nick_name, mtime, operator, status, sync_type, update_type').where(wheres, ...params).orderBy('id desc').limit(limit, offset * limit).query()
  }

  async queryIncrementSyncUserListCount(syncWay: SyncType[], status: IncrementStatus[], thirdCompanyId: string, content: string | undefined, scheduleTime: IncrementScheduleTimeSQL | undefined): Promise<number> {
    let whereClauses: string[] = []
    if (!!content) {
      whereClauses.push(`nick_name like ?`)
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

  async getOlderTime() {
    let ret = await this.select('sync_time').orderBy('sync_time ASC').limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return null
    }
    return ret[0].sync_time as any
  }

  async deleteDataByTime(time: string) {
    return this.remove('sync_time < ?', time).query()
  }

  async countData() {
    return this.db.select('select count(1) as total from tb_las_user_increment', [])
  }

}
