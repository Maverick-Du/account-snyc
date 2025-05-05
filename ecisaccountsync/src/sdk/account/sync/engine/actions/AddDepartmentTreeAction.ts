import { LocalDepartment } from '../../las'
import { WPSDepartment } from '../../was'
import { SyncAction, SyncActionType } from '../types'

export class AddDepartmentTreeAction implements SyncAction {
  name: SyncActionType = SyncActionType.AddDepartmentTree
  parent: WPSDepartment
  dept: LocalDepartment
  constructor(parent:WPSDepartment, dept: LocalDepartment) {
    this.parent = parent
    this.dept = dept
  }
}
