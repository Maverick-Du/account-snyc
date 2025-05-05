import { LocalDepartment } from '../../las/types'
import { WPSDepartment } from '../../was/types'
import { SyncAction, SyncActionType } from '../types'

export class SyncDeptDiffDepartmentTreeAction implements SyncAction {
  name: SyncActionType = SyncActionType.SyncDeptDiffDepartmentTree
  src: LocalDepartment
  dist: WPSDepartment
  constructor(src: LocalDepartment, dist: WPSDepartment) {
    this.src = src
    this.dist = dist
  }
}
