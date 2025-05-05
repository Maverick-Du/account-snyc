/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"

export interface FullSyncDelThreshold {
  id: number,
  company_id: string,
  user_del: number,
  dept_del: number,
  dept_user_del: number,
  operator: string,
  ctime?: Date
  mtime?: Date
}

export class FullSyncDelThresholdTable extends Table<FullSyncDelThreshold> {
  constructor(db: IDatabase) {
    super(db, 'tb_full_sync_del_threshold')
  }

  async addConfig(ovs: Partial<FullSyncDelThreshold>): Promise<number> {
    return this.add(ovs).query()
  }

  async getConfig(company_id: string) {
    return this.get('company_id =?', company_id).query()
  }

  async updateConfig(company_id: string, user_del: number, dept_del: number, dept_user_del: number, operator: string) {
    await this.update({
      user_del: user_del,
      dept_del: dept_del,
      dept_user_del: dept_user_del,
      operator: operator
    }).where('company_id =?', company_id).query()
  }

}
