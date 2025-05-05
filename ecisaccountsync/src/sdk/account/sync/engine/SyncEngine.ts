/* eslint-disable camelcase */
import { Exception, log, Result, Ticker, check } from '../../../cognac/common'

import { V7AccountSystem } from '../was'
import { LocalAccountSystem } from '../las'

import { SyncTask } from './SyncTask'
import { SyncStrategyType, SyncActionType } from './types'
import {
  IDiffDepartmentTreeContext,
  IDiffDepartmentTreeResult,
  IAddDepartmentTreeContext,
  IAddDepartmentTreeResult,
  IDeleteDepartmentTreeContext,
  IDeleteDepartmentTreeResult,
  IDeleteDepartmentContext,
  IDeleteDepartmentResult,
  IDiffUserTableContext,
  IDiffUserTableResult,
  IHandleLasDataCheckTypeContext,
  IHandleLasDataCheckTypeResult,
  IDiffDepartmentMembersResult, IDiffDepartmentMembersContext
} from './strategies'

import {
  AddDepartmentTreeAction,
  DeleteDepartmentAction,
  DeleteDepartmentTreeAction,
  DiffDepartmentTreeAction,
  DiffRootDepartmentMemberAction,
  DiffUserTableAction, HandleLasDataCheckAction
} from './actions'
import fullSyncTaskService from "../../../../modules/service/FullSyncTaskService";
import {DiffUserLeaderAction} from "./actions/DiffUserLeaderAction";
import {IUpdateUserLeaderContext} from "./strategies/UpdateUserLeaderStrategy";
import {StrategyManager} from "../../../cognac";
import {QuickAddUsersAction} from "./actions/QuickAddUsersAction";
import {IQuickAddUserContext, IQuickAddUserResult} from "./strategies/QuickAddUserStrategy";
import {SyncDeptDiffDepartmentTreeAction} from "./actions/SyncDeptDiffDepartmentTreeAction";
import {SyncDeptDeleteDepartmentTreeAction} from "./actions/SyncDeptDeleteDepartmentTreeAction";
import {SyncDeptAddDepartmentTreeAction} from "./actions/SyncDeptAddDepartmentTreeAction";
import {StatisticsErrorDataAction} from "./actions/StatisticsErrorDataAction";
import {V7OpenIamService} from "../was/V7OpenIamService";

export class SyncEngine {
  las: LocalAccountSystem = null
  was: V7AccountSystem = null
  openIam: V7OpenIamService = null
  sm: StrategyManager = null

  constructor(
    las: LocalAccountSystem,
    was: V7AccountSystem,
    openIam: V7OpenIamService,
    sm: StrategyManager
  ) {
    this.las = las
    this.was = was
    this.openIam = openIam
    this.sm = sm
  }

  async start(task: SyncTask) {
    const wroot = await this.was.root(task.cfg.companyId)
    const lroot = await this.las.root(task.originTaskId, task.cfg.thirdCompanyId)
    task.rootDid = lroot.did
    task.push(new DiffUserLeaderAction())
    task.push(new DiffRootDepartmentMemberAction(lroot, wroot))
    task.push(new DiffDepartmentTreeAction(lroot, wroot))
    task.push(new QuickAddUsersAction())
    task.push(new SyncDeptDiffDepartmentTreeAction(lroot, wroot))
    task.push(new DiffUserTableAction())
    task.push(new HandleLasDataCheckAction())
    // task.push(new StatisticsErrorDataAction())
    await this.run(task)
    return task
  }

  async run(task: SyncTask) {
    await this.onRun(task)
  }

  private async onRun(task: SyncTask) {
    while (!task.isEmpty()) {
      fullSyncTaskService.checkTaskIsNeedStop(task.taskId, task.cfg.companyId)
      const item = task.pop()
      switch (item.name) {
        case SyncActionType.AddDepartmentTree:
          await this.onAddDepartmentTree(task, item as AddDepartmentTreeAction)
          break
        case SyncActionType.DeleteDepartmentTree:
          await this.onDeleteDepartmentTree(
            task,
            item as DeleteDepartmentTreeAction
          )
          break
        case SyncActionType.DiffDepartmentTree:
          await this.onDiffDepartmentTree(
            task,
            item as DiffDepartmentTreeAction
          )
          break
        case SyncActionType.DeleteDepartment:
          await this.onDeleteDepartment(task, item as DeleteDepartmentAction)
          break
        case SyncActionType.DiffUserTable:
          await this.onDiffUserTable(task, item as DiffUserTableAction)
          break
        case SyncActionType.DiffRootDepartmentMember:
          await this.onDiffRootDepartmentMember(task, item as DiffRootDepartmentMemberAction)
          break
        case SyncActionType.DiffUserLeader:
          await this.onDiffUserLeader(task, item as DiffUserLeaderAction)
          break
        case SyncActionType.HandleLasCheckType:
          await this.onHandleLasData(task, item as HandleLasDataCheckAction)
          break
        case SyncActionType.QuickAddUser:
          await this.onQuickAddUsers(task, item as QuickAddUsersAction)
          break
        case SyncActionType.StatisticsErrorData:
          await this.onStatisticsErrorData(task, item as StatisticsErrorDataAction)
          break
        case SyncActionType.SyncDeptAddDepartmentTree:
          await this.onSyncDeptAddDepartmentTree(task, item as SyncDeptAddDepartmentTreeAction)
          break
        case SyncActionType.SyncDeptDeleteDepartmentTree:
          await this.onSyncDeptDeleteDepartmentTree(
              task,
              item as SyncDeptDeleteDepartmentTreeAction
          )
          break
        case SyncActionType.SyncDeptDiffDepartmentTree:
          await this.onSyncDeptDiffDepartmentTree(
              task,
              item as SyncDeptDiffDepartmentTreeAction
          )
          break
        default:
          throw new Exception('syncFailed', 'name not supported')
      }
    }
  }

  private async onDiffDepartmentTree(
    task: SyncTask,
    action: DiffDepartmentTreeAction
  ) {
    const { src, dist } = action
    if (!src || !dist) {
      throw new Error(`onDiffDepartmentTree throw error,reason: src or dist dept undefine. src: ${JSON.stringify(src)}, dist: ${JSON.stringify(dist)}`)
    }
    const ctx: IDiffDepartmentTreeContext = {
      engine: this,
      task,
      src,
      dist
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IDiffDepartmentTreeResult>(
      SyncStrategyType.DiffDepartmentTree,
      ctx
    )
    log.d('sync.engine.onDiffDepartmentTree', `[${tick.end()}]`, JSON.stringify(src), '=>', JSON.stringify(dist))
    check(ret)
    return ret
  }

  private async onDeleteDepartmentTree(
    task: SyncTask,
    action: DeleteDepartmentTreeAction
  ) {
    const { dept } = action
    const ctx: IDeleteDepartmentTreeContext = {
      engine: this,
      task,
      dept
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IDeleteDepartmentTreeResult>(
      SyncStrategyType.DeleteDepartmentTree,
      ctx
    )
    log.d('sync.engine.onDeleteDepartmentTree', `[${tick.end()}]`, JSON.stringify(dept))
    check(ret)
    return ret
  }

  private async onAddDepartmentTree(
    task: SyncTask,
    action: AddDepartmentTreeAction
  ) {
    const { dept, parent } = action
    const ctx: IAddDepartmentTreeContext = {
      engine: this,
      task,
      parent,
      dept
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IAddDepartmentTreeResult>(
      SyncStrategyType.AddDepartmentTree,
      ctx
    )
    log.d('sync.engine.onAddDepartmentTree', `[${tick.end()}]`, JSON.stringify(dept))
    check(ret)
    return ret
  }

  private async onDeleteDepartment(
    task: SyncTask,
    action: DeleteDepartmentAction
  ) {
    const { dept } = action
    const ctx: IDeleteDepartmentContext = {
      engine: this,
      dept,
      task
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IDeleteDepartmentResult>(
      SyncStrategyType.DeleteDepartment,
      ctx
    )
    log.d('sync.engine.onDeleteDepartment', `[${tick.end()}]`, JSON.stringify(dept))
    return ret
  }

  private async onDiffUserTable(task: SyncTask, action: DiffUserTableAction) {
    const ctx: IDiffUserTableContext = {
      engine: this,
      task
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IDiffUserTableResult>(
      SyncStrategyType.DiffUserTable,
      ctx
    )
    log.d('sync.engine.onDiffUserTable', `[${tick.end()}]`)
    check(ret)
    return ret
  }

  private async onDiffRootDepartmentMember(
    task: SyncTask,
    action: DiffRootDepartmentMemberAction
  ) {
    const { src, dist } = action
    const ctx: IDiffDepartmentMembersContext = {
      engine: this,
      dept: dist,
      from: src,
      task: task,
      diffRootMember: true
    }
    const ret = await this.sm.exec<IDiffDepartmentMembersResult>(SyncStrategyType.DiffDepartmentMembers, ctx)
    check(ret)
    return ret
  }

  private async onDiffUserLeader (
      task: SyncTask,
      action: DiffUserLeaderAction
  ) {
    const ctx: IUpdateUserLeaderContext = {
      engine: this,
      task
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IDiffUserTableResult>(
        SyncStrategyType.UpdateUserLeader,
        ctx
    )
    log.d('sync.engine.onDiffUserLeader', `[${tick.end()}]`)
    check(ret)
    return ret
  }

  private async onHandleLasData (
      task: SyncTask,
      action: HandleLasDataCheckAction
  ) {
    const ctx: IHandleLasDataCheckTypeContext = {
      engine: this,
      task
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IHandleLasDataCheckTypeResult>(
        SyncStrategyType.HandleLasCheckType,
        ctx
    )
    log.d('sync.engine.onHandleLasData', `[${tick.end()}]`)
    check(ret)
    return ret
  }

  private async onQuickAddUsers(
      task: SyncTask,
      action: HandleLasDataCheckAction
  ) {
    const ctx: IQuickAddUserContext = {
      engine: this,
      task
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IQuickAddUserResult>(
        SyncStrategyType.QuickAddUser,
        ctx
    )
    log.d('sync.engine.onQuickAddUsers', `[${tick.end()}]`)
    check(ret)
    return ret
  }

  private async onStatisticsErrorData(
      task: SyncTask,
      action: StatisticsErrorDataAction
  ) {
    const ctx: IQuickAddUserContext = {
      engine: this,
      task
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IQuickAddUserResult>(
        SyncStrategyType.StatisticsErrorData,
        ctx
    )
    log.d('sync.engine.onStatisticsErrorData', `[${tick.end()}]`)
    check(ret)
    return ret
  }

  private async onSyncDeptDiffDepartmentTree(
      task: SyncTask,
      action: SyncDeptDiffDepartmentTreeAction
  ) {
    const { src, dist } = action
    if (!src || !dist) {
      throw new Error(`onSyncDeptDiffDepartmentTree throw error,reason: src or dist dept undefine. src: ${JSON.stringify(src)}, dist: ${JSON.stringify(dist)}`)
    }
    const ctx: IDiffDepartmentTreeContext = {
      engine: this,
      task,
      src,
      dist
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IDiffDepartmentTreeResult>(
        SyncStrategyType.SyncDeptDiffDepartmentTree,
        ctx
    )
    log.d('sync.engine.onSyncDeptDiffDepartmentTree', `[${tick.end()}]`, JSON.stringify(src), '=>', JSON.stringify(dist))
    check(ret)
    return ret
  }

  private async onSyncDeptDeleteDepartmentTree(
      task: SyncTask,
      action: SyncDeptDeleteDepartmentTreeAction
  ) {
    const { dept } = action
    const ctx: IDeleteDepartmentTreeContext = {
      engine: this,
      task,
      dept
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IDeleteDepartmentTreeResult>(
        SyncStrategyType.SyncDeptDeleteDepartmentTree,
        ctx
    )
    log.d('sync.engine.onSyncDeptDeleteDepartmentTree', `[${tick.end()}]`, JSON.stringify(dept))
    check(ret)
    return ret
  }

  private async onSyncDeptAddDepartmentTree(
      task: SyncTask,
      action: SyncDeptAddDepartmentTreeAction
  ) {
    const { dept, parent } = action
    const ctx: IAddDepartmentTreeContext = {
      engine: this,
      task,
      parent,
      dept
    }
    const tick = new Ticker()
    const ret = await this.sm.exec<IAddDepartmentTreeResult>(
        SyncStrategyType.SyncDeptAddDepartmentTree,
        ctx
    )
    log.d('sync.engine.onSyncDeptAddDepartmentTree', `[${tick.end()}]`, JSON.stringify(dept))
    check(ret)
    return ret
  }

  private e2r(error:any) {
    const code = error?.code
    if (error instanceof Error) {
      return new Result(code || error.name || 'error', error.message)
    }

    if (typeof error === 'string') {
      return new Result(code || 'error', error)
    }

    return new Result(code || 'error', error.toString())
  }
}
