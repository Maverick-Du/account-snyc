import { SyncAction, SyncActionType } from '../types'
import { LocalDepartment } from '../../las/types'
import { WPSDepartment } from '../../was/types'

export class DiffRootDepartmentMemberAction implements SyncAction {
  name: SyncActionType = SyncActionType.DiffRootDepartmentMember
  src: LocalDepartment
  dist: WPSDepartment
  constructor(src: LocalDepartment, dist: WPSDepartment) {
    this.src = src
    this.dist = dist
  }
}
