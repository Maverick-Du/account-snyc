/* eslint-disable camelcase */
import {StrategyResult} from "../../../cognac";
import { SyncEngine } from './SyncEngine'
import {FullSyncTaskStatistics, SyncAction} from './types'
import { CompanyCfg } from '../las'
import {FullSyncStatus} from "../../../../modules/db/types";
import {FullSyncTaskSchema} from "../../../../modules/db/tables/FullSyncTask";

export enum SyncStatus {
  pending,
  running,
  complete
}

export class SyncTask {
  taskId: string
  originTaskId: string
  engine: SyncEngine
  status: FullSyncStatus
  result: StrategyResult
  msg: string
  scopeVersion: number
  continueSync: boolean
  againCheck: boolean
  private stack: Array<SyncAction>
  cfg: CompanyCfg
  statistics: FullSyncTaskStatistics
  rootDid: string

  constructor(engine: SyncEngine, task: FullSyncTaskSchema, originTaskId: string, cfg: CompanyCfg, continueSync: boolean) {
    this.engine = engine
    this.stack = []
    this.status = FullSyncStatus.SYNC_ING
    this.result = null
    this.msg = ""
    this.scopeVersion = task.scope_version
    this.cfg = cfg
    this.taskId = task.task_id
    this.originTaskId = originTaskId
    this.continueSync = continueSync
    this.againCheck = false
    this.statistics = {
      task_id: task.task_id,
      company_id: cfg.companyId
    }
  }

  isEmpty() {
    return this.stack.length === 0
  }

  pop() {
    return this.stack.pop()
  }

  push(action: SyncAction) {
    this.stack.push(action)
  }
}
