import { LocalDepartment } from '../../las/types'
import { WPSDepartment } from '../../was/types'
import { SyncAction, SyncActionType } from '../types'

export class DiffDepartmentTreeAction implements SyncAction {
  name: SyncActionType = SyncActionType.DiffDepartmentTree
  src: LocalDepartment
  dist: WPSDepartment
  constructor(src: LocalDepartment, dist: WPSDepartment) {
    this.src = src
    this.dist = dist
  }
}
