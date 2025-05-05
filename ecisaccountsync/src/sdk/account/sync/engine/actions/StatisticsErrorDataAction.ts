import { SyncAction, SyncActionType } from '../types'

export class StatisticsErrorDataAction implements SyncAction {
  name: SyncActionType = SyncActionType.StatisticsErrorData
}
