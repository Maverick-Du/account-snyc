/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"
import {ScopeCheckType, SyncScopeStatus} from '../types'

export interface FullSyncScopeSchema {
  id: number,
  company_id: string,
  platform_id: string,
  did: string,
  name: string,
  check_type: ScopeCheckType,
  operator: string,
  status: SyncScopeStatus,
  ctime?: Date
  mtime?: Date
}

export class FullSyncScopeTable extends Table<FullSyncScopeSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_full_sync_scope')
  }

  async getAllEnableScopes(companyId: string, platformId?: string) {
    let clause = null
    let arr = []
    if (platformId) {
      clause = 'company_id = ? and platform_id = ? and status = ?'
      arr.push(companyId, platformId, SyncScopeStatus.ENABLE)
    } else {
      clause = 'company_id = ? and status = ?'
      arr.push(companyId, SyncScopeStatus.ENABLE)
    }
    return this.select('*').where(clause, ...arr).query()
  }

  async addScope(ovs: Partial<FullSyncScopeSchema>): Promise<number> {
    return this.add(ovs).query()
  }

  async updateScope(id: number, name: string, check_type: ScopeCheckType, operator: string) {
    return this.update({
      name: name,
      check_type: check_type,
      operator: operator
    } as FullSyncScopeSchema).where('id = ?', id).query()
  }


  async deleteScopes(ids: number[], operator: string) {
    return this.update({
      status: SyncScopeStatus.DISABLE,
      operator: operator
    } as FullSyncScopeSchema).where('id in (?)', ids).query()
  }

  async deleteDisableScopeConfig(time: string) {
    return this.remove('mtime < ? and status = ?', time, SyncScopeStatus.DISABLE).query()
  }
}
