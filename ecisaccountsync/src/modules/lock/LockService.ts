import { log } from '../../sdk/cognac'
import { LockSchema, LockTable } from './LockTable'
import {IDatabase} from "../../sdk/cognac/orm";

export enum LockKey {
  BATCH_SYNC = "BATCH_SYNC",
  CREATE_SYNC = "CREATE_SYNC",
  UPDATE_SYNC_SCOPE = "UPDATE_SYNC_SCOPE",
  SYNC_STATISTIC_ANALYSE = "SYNC_STATISTIC_ANALYSE" // 全量同步任务统计分析锁
}

class LockService {
  private db: IDatabase
  private lockTable: LockTable

  init(db: IDatabase) {
    this.db = db
    this.lockTable = new LockTable(db)
  }

  async releaseLock(lockId: number, key: string) {
    try {
      await this.lockTable.release(lockId, key)
      log.i({ info: `release lock. lock_id: ${lockId}, lock_key: ${key}` })
    } catch (err) {
      err.msg = `release lock failed. lock_id: ${lockId}, lock_key: ${key}`
      log.error(err)
    }
  }

  async lock(key: string, desc:string = key): Promise<number> {
    try {
      const locks = await this.lockTable.getLock(key)
      if (locks.length > 0) {
        throw new Error(`get lock failed. lock_key: ${key} exist lock.`)
      }
      const lockId = await this.lockTable.lock(key, desc)
      log.i({ info: `lock success. lock_id: ${lockId}, lock_key: ${key}, desc: ${desc}`, lockId, key, desc })
      return lockId
    }catch (err) {
      log.error(err)
      throw new Error(`get lock failed. lock_key: ${key} exist lock.`)
    }
  }

  async tryLock(key: string, desc:string = key, etime:number = 0): Promise<number> {
    try {
      const locks = await this.lockTable.getLock(key)
      if (locks.length > 0) {
        // 检查锁是否超时
        let flag = await this.releaseExpiredLock(locks)
        if (flag) {
          return 0
        }
      }
      const lockId = await this.lockTable.lock(key, desc, etime)
      log.i({ info: `lock success. lock_id: ${lockId}, lock_key: ${key}, desc: ${desc}, etime: `, lockId, key, desc, etime })
      return lockId
    } catch (err) {
      err.msg = `get lock failed. lock_key: ${key}.`
      log.info(err)
      return 0
    }
  }

  async releaseExpiredLock(locks: LockSchema[]): Promise<boolean> {
    try {
      // 单位是秒
      let existLock = false
      let now  = new Date().getTime() / 1000
      for (const lock of locks) {
        if (lock.etime > 0 && lock.etime < now) {
            // 锁超时
            log.i({ info: `release expired lock. lock_key: ${lock.lock_key}, desc: ${lock.desc}, etime: ${lock.etime}` })
            await this.releaseLock(lock.id, lock.lock_key)
        } else {
          existLock = true
        }
      }
      return existLock
    } catch (err) {
      err.msg = `release expired lock failed.`
      log.error(err)
      throw err
    }
  }

  async releaseAllLock(regionId: string) {
    try {
      await this.lockTable.releaseAllLock(regionId)
      log.i({ info: `release all lock success. regionId: ${regionId}` })
    } catch (err) {
      err.msg = `release all lock failed. regionId: ${regionId}`
      log.error(err)
      throw err
    }
  }

  async getLock(lockKey: string): Promise<LockSchema> {
    const locks = await this.lockTable.getLock(lockKey)
    if (locks.length <= 0 ) {
      return null
    }
    return locks[0]
  }

  async existLock(lockKey: string): Promise<boolean> {
    const locks = await this.lockTable.getLock(lockKey)
    return locks.length > 0
  }
}

export default new LockService()
