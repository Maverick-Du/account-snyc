/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"
import { FullSyncUpdateType, StatisticAnalyseTbType, StatisticAnalyseErrType, StatisticAnalyseOperateType, AnalyseListOvs } from '../types'

export interface FullSyncErrAnalyseRecord {
  id: number,
  company_id: string,
  task_id: string,
  // status: number,
  sync_tb_type: StatisticAnalyseTbType,
  operate_type: StatisticAnalyseOperateType,
  err_type: StatisticAnalyseErrType,
  extra: string,
  count: number,
  ctime?: Date
  mtime?: Date
}

export class FullSyncErrAnalyseRecordTable extends Table<FullSyncErrAnalyseRecord> {
  constructor(db: IDatabase) {
    super(db, 'tb_full_sync_err_analyse_record')
  }

  async addAnalyse(ovs: Partial<FullSyncErrAnalyseRecord>): Promise<number> {
    return this.add(ovs).query()
  }

  async getAllAnalyseList(company_id: string, task_id: string): Promise<FullSyncErrAnalyseRecord[]> {
    return this.select('*').where('task_id = ? and company_id = ?', task_id, company_id).query()
  }

  async getAnalyseList(company_id: string, task_id: string, offset: number, limit: number, ovs: Partial<AnalyseListOvs>) {
    let whereClauses: string[] = []
    whereClauses.push(' task_id = ? and company_id = ?')
    if (!!ovs.operate_type ) {
      whereClauses.push('operate_type = ?')
    }
    if (!!ovs.sync_tb_type) {
      whereClauses.push('sync_tb_type = ?')
    }
    if (!!ovs.err_type) {
      whereClauses.push('err_type = ?')
    } else {
      whereClauses.push('extra is null')
    }


    const wheres = whereClauses.join(' and ')
    const params = [
      task_id,
      company_id,
      ...(ovs.operate_type ? [ovs.operate_type] : []),
      ...(ovs.sync_tb_type ? [ovs.sync_tb_type] : []),
      ...(ovs.err_type ? [ovs.err_type] : []),
    ]
    return this.select('company_id,task_id,sync_tb_type,operate_type,err_type,count,extra').where(wheres, ...params).orderBy('id desc').limit(limit, limit * offset).query()
  }

  async getAnalyseListCount(company_id: string, task_id: string, ovs: Partial<AnalyseListOvs>): Promise<number> {
    let whereClauses: string[] = []
    whereClauses.push('task_id = ? and company_id = ?')
    if (!!ovs.operate_type ) {
      whereClauses.push('operate_type = ?')
    }
    if (!!ovs.sync_tb_type) {
      whereClauses.push('sync_tb_type = ?')
    }
    if (!!ovs.err_type) {
      whereClauses.push('err_type = ?')
    } else {
      whereClauses.push('extra is null')
    }



    const wheres = whereClauses.join(' and ')
    const params = [
      task_id,
      company_id,
      ...(ovs.operate_type ? [ovs.operate_type] : []),
      ...(ovs.sync_tb_type ? [ovs.sync_tb_type] : []),
      ...(ovs.err_type ? [ovs.err_type] : []),
    ]
    const countList: any[] = await this.select('count(*) as count').where(wheres, ...params).query()
    return countList[0].count
  }
}




