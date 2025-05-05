import { WPSDepartment } from '../../was'
import { SyncAction, SyncActionType } from '../types'

export class DeleteDepartmentAction implements SyncAction {
  name: SyncActionType = SyncActionType.DeleteDepartment
  dept: WPSDepartment
  constructor(dept: WPSDepartment) {
    this.dept = dept
  }
}
