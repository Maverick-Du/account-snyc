import { WPSDepartment } from '../../was/types'
import { SyncAction, SyncActionType } from '../types'

export class DeleteDepartmentTreeAction implements SyncAction {
  name: SyncActionType = SyncActionType.DeleteDepartmentTree
  dept: WPSDepartment
  constructor(dept: WPSDepartment) {
    this.dept = dept
  }
}
