/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"

export interface FullSyncMidAnalyseRecord {
  id: number,
  company_id: string,
  task_id: string,
  // status: number,
  total_user: number,
  total_dept: number,
  total_dept_user: number,
  sync_dept: number,
  sync_user: number,
  drift_dept: number,
  drift_dept_user: number,
  drift_user: number,
  select_all: number,
  select_total_user: number,
  select_total_dept: number,
  ctime?: Date
  mtime?: Date
}

export class FullSyncMidAnalyseRecordTable extends Table<FullSyncMidAnalyseRecord> {
  constructor(db: IDatabase) {
    super(db, 'tb_full_sync_mid_analyse_record')
  }

  async addAnalyse(ovs: Partial<FullSyncMidAnalyseRecord>): Promise<number> {
    return this.add(ovs).query()
  }

  async getAnalyse(company_id: string, task_id: string) {
    return this.get('company_id = ? and task_id = ?', company_id, task_id).query()
  }
}
