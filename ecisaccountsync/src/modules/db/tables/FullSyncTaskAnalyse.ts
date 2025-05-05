/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"
import { FullSyncStatisticAnalyseStatus } from '../types'

export interface FullSyncTaskAnalyse {
  id: number,
  company_id: string,
  task_id: string,
  status: FullSyncStatisticAnalyseStatus,
  operator: string,
  err_msg: string,
  ctime?: Date
  mtime?: Date
}

export class FullSyncTaskAnalyseTable extends Table<FullSyncTaskAnalyse> {
  constructor(db: IDatabase) {
    super(db, 'tb_full_sync_task_analyse')
  }

  async addAnalyse(ovs: Partial<FullSyncTaskAnalyse>): Promise<number> {
    return this.add(ovs).query()
  }

  async getAnalyse(company_id: string, task_id: string) {
    return this.get('task_id = ? and company_id = ?', task_id, company_id).query()
  }

  async updateAnalyse(company_id: string, task_id: string, ovs: Partial<FullSyncTaskAnalyse>) {
    return this.update(ovs).where('task_id = ? and company_id  = ?', task_id, company_id).query()
  }

  async clearAnalyse() {
    return this.update({ status: FullSyncStatisticAnalyseStatus.ANALYSE_FAIL, err_msg: '程序中断' }).where('status in (?, ?)', FullSyncStatisticAnalyseStatus.ANALYSE_ING, FullSyncStatisticAnalyseStatus.ANALYSE_STOP_ING).query()
  }
}
