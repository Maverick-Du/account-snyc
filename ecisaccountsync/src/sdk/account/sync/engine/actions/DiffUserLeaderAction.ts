import { SyncAction, SyncActionType } from '../types'

export class DiffUserLeaderAction implements SyncAction {
  name: SyncActionType = SyncActionType.DiffUserLeader
}
