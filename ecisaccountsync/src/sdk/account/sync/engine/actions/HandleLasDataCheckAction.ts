import { SyncAction, SyncActionType } from '../types'

export class HandleLasDataCheckAction implements SyncAction {
  name: SyncActionType = SyncActionType.HandleLasCheckType
}
