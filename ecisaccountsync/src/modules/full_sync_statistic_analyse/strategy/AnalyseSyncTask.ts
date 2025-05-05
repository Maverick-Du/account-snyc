import { CompanyCfg } from "../../../sdk/account"
import { FullSyncStatisticAnalyseStatus } from "../../db/types"
import { SyncStatisticAnalyseEngine } from "./SyncStatisticAnalyseEngine"
import { SyncAction } from "./type"

export default class AnalyseSyncTask {
  taskId: string
  originTaskId: string
  engine: SyncStatisticAnalyseEngine
  status: FullSyncStatisticAnalyseStatus
  msg: string
  cfg: CompanyCfg
  addErrRecords: Set<string>
  private stack: Array<SyncAction>

  constructor(engine: SyncStatisticAnalyseEngine, taskId: string, originTaskId: string, cfg: CompanyCfg, addErrRecords: string[]) {
    this.engine = engine
    this.stack = []
    this.addErrRecords = new Set(addErrRecords)
    this.status = FullSyncStatisticAnalyseStatus.ANALYSE_ING
    this.msg = ""
    this.taskId = taskId
    this.originTaskId = originTaskId
    this.cfg = cfg
  }

  isEmpty() {
    return this.stack.length === 0
  }

  push(action: SyncAction) {
    this.stack.push(action)
  }

  pop() {
    return this.stack.pop()
  }

  preSet(actions: SyncAction[]) {
    this.stack.push(...actions)
  }

  hasRecord(errRecord: string) {
    return this.addErrRecords.has(errRecord)
  }
}