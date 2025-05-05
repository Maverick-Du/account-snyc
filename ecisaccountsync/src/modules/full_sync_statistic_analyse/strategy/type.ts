export enum SyncAnalyseActionType {
  FullSyncCollectTableStatisticAnalyse = "full.sync.collect.table.statistic.analyse",
  FullSyncDeptAddErrorStatisticAnalyse = "full.sync.dept.add.error.statistic.analyse",
  FullSyncUserAddErrorStatisticAnalyse = "full.sync.user.add.error.statistic.analyse",
  FullyncDeptUserAddErrorStatisticAnalyse = "full.sync.dept.user.add.error.statistic.analyse",
  FullSyncAddErrorStatisticAnalyse = "full.sync.add.error.statistic.analyse",
}

export interface SyncAction {
  name: SyncAnalyseActionType
}

export enum SyncAnalyseStrategyType {
  FullSyncCollectTableStatisticAnalyse = "full.sync.collect.table.statistic.analyse",
  FullSyncDeptAddErrorStatisticAnalyse = "full.sync.dept.add.error.statistic.analyse",
  FullSyncUserAddErrorStatisticAnalyse = "full.sync.user.add.error.statistic.analyse",
  FullyncDeptUserAddErrorStatisticAnalyse = "full.sync.dept.user.add.error.statistic.analyse",
  FullSyncAddErrorStatisticAnalyse = "full.sync.add.error.statistic.analyse",
}

export enum AnalyseCommonErrName {
  AnalyseStop = "analyse_stop"
}

export interface AnalyseStopEntity {
  taskId: string
  name: string
  message: string
  companyId: string
}

export class AnalyseTaskStopError implements Error {
  taskId: string
  name: string
  message: string
  constructor(taskId: string, name: string, msg: string) {
    this.taskId = taskId
    this.name = name
    this.message = msg
  }
}