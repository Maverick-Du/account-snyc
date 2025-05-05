/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"

export interface FullSyncScopeVersion {
  id: number,
  company_id: string,
  scope_version: number,
  ctime?: Date
  mtime?: Date
}

export class FullSyncScopeVersionTable extends Table<FullSyncScopeVersion> {
  constructor(db: IDatabase) {
    super(db, 'tb_full_sync_scope_version')
  }

  async addConfig(ovs: Partial<FullSyncScopeVersion>): Promise<number> {
    return this.add(ovs).query()
  }

  async getScopeVersion(company_id: string) {
    return this.get('company_id =?', company_id).query()
  }

  async updateScopeVersion(company_id: string) {
    await this.db.update('update tb_full_sync_scope_version set scope_version = scope_version + 1 where company_id =?', [company_id])
  }

}
