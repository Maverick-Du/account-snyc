import { WPSDepartment } from '../../was/types'
import { SyncAction, SyncActionType } from '../types'

export class SyncDeptDeleteDepartmentTreeAction implements SyncAction {
  name: SyncActionType = SyncActionType.SyncDeptDeleteDepartmentTree
  dept: WPSDepartment
  constructor(dept: WPSDepartment) {
    this.dept = dept
  }
}
