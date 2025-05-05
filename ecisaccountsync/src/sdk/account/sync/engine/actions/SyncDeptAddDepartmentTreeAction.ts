import { LocalDepartment } from '../../las/types'
import { WPSDepartment } from '../../was/types'
import { SyncAction, SyncActionType } from '../types'

export class SyncDeptAddDepartmentTreeAction implements SyncAction {
  name: SyncActionType = SyncActionType.SyncDeptAddDepartmentTree
  parent: WPSDepartment
  dept: LocalDepartment
  constructor(parent:WPSDepartment, dept: LocalDepartment) {
    this.parent = parent
    this.dept = dept
  }
}
