
export enum SyncActionType {
  SyncDeptDiffDepartmentTree = 'sync.dept.tree.syncDept.diff',
  SyncDeptAddDepartmentTree = 'sync.dept.tree.syncDept.add',
  SyncDeptDeleteDepartmentTree = 'sync.dept.tree.syncDept.delete',

  DiffDepartmentTree = 'sync.dept.tree.diff',
  AddDepartmentTree = 'sync.dept.tree.add',
  DeleteDepartmentTree = 'sync.dept.tree.delete',

  DeleteDepartment = 'sync.dept.delete',

  StatisticsErrorData = 'sync.statistics.error.data',
  QuickAddUser = 'sync.user.quick.add',
  DiffUserTable = 'sync.user.table.diff',
  DiffRootDepartmentMember = 'sync.dept.root.member.diff',
  DiffUserLeader = 'sync.user.leader.diff',

  HandleLasCheckType = 'sync.handle.las.checkType'
}

export interface SyncAction {
  name: SyncActionType
}

export interface SyncMap<T> {
  [key: string]: T
}

export enum SyncStrategyType {
  SyncDeptDeleteDepartmentTree = 'sync.dept.tree.syncDept.delete',
  SyncDeptAddDepartmentTree = 'sync.dept.tree.syncDept.add',
  SyncDeptDiffDepartmentTree = 'sync.dept.tree.syncDept.diff',
  SyncDeptMoveDepartmentTree = 'sync.dept.tree.syncDept.move',
  DiffAllDepartmentMembers = 'sync.dept.all.diff.members',

  DeleteDepartmentTree = 'sync.dept.tree.delete',
  AddDepartmentTree = 'sync.dept.tree.add',
  DiffDepartmentTree = 'sync.dept.tree.diff',
  MoveDepartmentTree = 'sync.dept.tree.move',

  AddDepartment = 'sync.dept.add',
  DeleteDepartment = 'sync.dept.delete',
  MoveDepartment = 'sync.dept.move',

  UpdateDepartment = 'sync.dept.update',
  DiffDepartmentMembers = 'sync.dept.diff.members',
  UpdateDepartmentLeaders = 'sync.dept.update.leaders',
  UpdateDepartmentProperties = 'sync.dept.update.properties',
  DeleteDepartmentMember = 'sync.dept.delete.member',
  UpdateDepartmentMember = 'sync.dept.update.member',
  JoinDepartmentMember = 'sync.dept.join.member',
  AddDepartmentMembers = 'sync.dept.add.members',

  StatisticsErrorData = 'sync.statistics.error.data',
  QuickAddUser = 'sync.user.quick.add',
  DiffUserTable = 'sync.user.table.diff',
  // AddUser = 'sync.user.add',
  // BatchAddUser = 'sync.user.batchAdd',
  // BatchUpdateUser = 'sync.user.batchUpdate',
  BatchDeleteUser = 'sync.user.batchDelete',
  UpdateUser = 'sync.user.update',
  // DeleteUser = 'sync.user.delete',
  UpdateUserLeader = 'sync.user.leader.update',
  EnableUsers = 'sync.user.enable',
  DisableUsers = 'sync.user.disable',

  HandleLasCheckType = 'sync.handle.las.checkType'
}

export interface FullSyncTaskStatistics {
  task_id: string,
  company_id: string,
  total_user?: number,
  scope_user?: number,
  sync_user?: number,
  total_dept?: number,
  scope_dept?: number,
  sync_dept?: number,
  sync_dept_set?: Set<string>,
  total_dept_user?: number,
  scope_dept_user?: number,
  sync_dept_user?: number,
  dept_add?: number,
  dept_add_error?: number,
  dept_update?: number,
  dept_update_error?: number,
  dept_update_set?: Set<string>,
  dept_update_set_ignore?: Set<string>,
  dept_update_ignore?: number,
  dept_delete?: number,
  dept_delete_error?: number,
  dept_move?: number,
  dept_move_error?: number,
  user_delete?: number,
  user_delete_error?: number,
  user_update?: number,
  user_update_error?: number,
  user_update_ignore?: number,
  user_add?: number,
  user_add_error?: number,
  user_enable?: number,
  user_enable_error?: number,
  user_disable?: number,
  user_disable_error?: number,
  user_leader_update?: number,
  user_leader_update_error?: number,
  dept_user_add?: number,
  dept_user_add_error?: number,
  dept_user_delete?: number,
  dept_user_delete_error?: number,
  // 该字段废弃
  dept_user_sort?: number,
  user_dept_update?: number,
  user_dept_update_error?: number,
  user_error?: number,
  dept_error?: number,
  dept_user_error?: number,
  total_success?: number,
  total_error?: number
}
