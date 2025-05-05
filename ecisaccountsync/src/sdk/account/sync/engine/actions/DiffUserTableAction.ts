import { SyncAction, SyncActionType } from '../types'

export class DiffUserTableAction implements SyncAction {
  name: SyncActionType = SyncActionType.DiffUserTable
}
