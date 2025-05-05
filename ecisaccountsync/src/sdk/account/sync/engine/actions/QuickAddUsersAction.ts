import { SyncAction, SyncActionType } from '../types'

export class QuickAddUsersAction implements SyncAction {
  name: SyncActionType = SyncActionType.QuickAddUser
}
