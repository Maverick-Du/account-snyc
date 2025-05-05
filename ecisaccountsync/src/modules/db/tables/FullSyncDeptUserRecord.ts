/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"
import {FullSyncUpdateType, RecordStatus, StatisticAnalyseOperateType} from '../types'

export interface FullSyncDeptUserRecord {
  id: number,
  task_id: string,
  company_id: string,
  name: string,
  account: string,
  platform_id: string,
  uid: string,
  wps_did: string,
  abs_path: string,
  update_type: FullSyncUpdateType,
  status: RecordStatus,
  msg?: string
  err_type?: string
  ctime?: Date
  mtime?: Date
}

export class FullSyncDeptUserRecordTable extends Table<FullSyncDeptUserRecord> {
  constructor(db: IDatabase) {
    super(db, 'tb_full_sync_dept_user_record')
  }

  async addRecord(ovs: Partial<FullSyncDeptUserRecord>): Promise<number> {
    return this.add(ovs).query()
  }

  async addRecords(ovs: Partial<FullSyncDeptUserRecord>[]) {
    return this.db.insert('insert into tb_full_sync_dept_user_record (task_id, company_id, `name`, account, platform_id, uid, wps_did, abs_path, update_type, `status`, msg) values ?', [ovs.map(o => [o.task_id, o.company_id, o.name, o.account, o.platform_id, o.uid, o.wps_did, o.abs_path, o.update_type, o.status, o.msg])])
  }

  async countData() {
    return this.db.select('select count(1) as total from tb_full_sync_dept_user_record', [])
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    await this.remove('task_id =?', taskId).query()
  }

  async queryRecordsByStatus(companyId: string, taskId: string, status: RecordStatus[]) {
    const statusString = status.join(',')
    return this.select('*').where('task_id = ? and company_id = ? and status in (' + statusString + ')', taskId, companyId).query()
  }

  async countDeptUserAddErr(companyId: string, taskId: string) {
    const countList: any[] = await this.select(`count(1) as total`).where(`task_id = ? and company_id = ? and status = ? and update_type = ?`, taskId, companyId, RecordStatus.FAIL, FullSyncUpdateType.UserDeptAdd).query()
    return countList[0].total
  }

  async queryRecordList(taskId: string, offset:number, limit: number, status: RecordStatus, updateType?: FullSyncUpdateType, errType?: string, content?: string) {
    let whereClauses: string[] = []
    whereClauses.push('task_id = ? and status = ?')
    if (!!updateType) {
      whereClauses.push('update_type = ?')
    }

    if (!!errType) {
      whereClauses.push('err_type = ?')
    }

    if (!!content) {
      whereClauses.push(`name like ?`)
      content = `${content}%`
    }

    const wheres = whereClauses.join(' and ')
    const params = [
      taskId,
      status,
      ...(updateType ? [updateType] : []),
      ...(errType ? [errType] : []),
      ...(content ? [content] : [])
    ]
    return this.select('task_id,company_id,account,name,uid,wps_did,abs_path,update_type,msg,platform_id,err_type').where(wheres, ...params).orderBy('id asc').limit(limit, limit * offset).query()
  }

  async queryRecordListCount(taskId: string, status: RecordStatus, updateType?: FullSyncUpdateType, errType?: string, content?: string) {
    let whereClauses: string[] = []
    whereClauses.push('task_id = ? and status = ?')
    if (!!updateType) {
      whereClauses.push('update_type = ?')
    }

    if (!!errType) {
      whereClauses.push('err_type = ?')
    }

    if (!!content) {
      whereClauses.push(`name like ?`)
      content = `${content}%`
    }

    const wheres = whereClauses.join(' and ')
    const params = [
      taskId,
      status,
      ...(updateType ? [updateType] : []),
      ...(errType ? [errType] : []),
      ...(content ? [content] : [])
    ]
    let countList: any[] = await this.select('count(1) as total').where(wheres, ...params).query()
    return countList[0].total as number
  }

  async queryAnalyseRecordErrCount(taskId: string, updateType: StatisticAnalyseOperateType, errType: string) {
    let countList: any[] = await this.select('count(1) as total').where('task_id = ? and status = ? and update_type =? and err_type = ?', taskId, RecordStatus.FAIL, updateType, errType).query()
    return countList[0].total as number
  }
}
