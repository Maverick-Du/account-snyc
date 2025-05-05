/* eslint-disable camelcase */
import {IDatabase, Table} from "../../sdk/cognac/orm";

export interface LockSchema {
  id: number
  lock_key: string
  desc: string
  etime: number
  ctime: number
  mtime: number
}

export class LockTable extends Table<LockSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_lock')
  }

  async getLock(key: string) {
    return this.select('*').where('lock_key=?', key).query()
  }

  async release(lockId: number, key: string) {
    return this.remove('id=? and lock_key=?', lockId, key).query()
  }

  async releaseAllLock(regionId: string) {
    return this.remove('region_id = ?', regionId).query()
  }

  async lock(key: string, desc: string, etime: number = 0) {
    return this.add({lock_key: key, desc: desc, etime: etime}).query()
  }
}
