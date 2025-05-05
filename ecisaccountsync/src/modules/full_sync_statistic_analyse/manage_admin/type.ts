import { FullSyncUpdateType, StatisticAnalyseErrType, StatisticAnalyseTbType } from "../../db/types"

export interface IFullSyncTaskAnalyseDetail {
  user: {
    total_user: number
    drift_dept_user: number  // 游离部门下的用户
    drift_user: number // 游离用户(不再任何部门下的用户)
    sync_user: number
    scope_user: number // 同步时勾选的用户数
    user_delete: number
    user_add: number
    user_update: number
    user_update_ignore: number
    user_leader_update: number
    user_enable: number
    user_disable: number
    user_add_error: number
    user_update_error: number
    user_delete_error: number
    user_enable_error: number
    user_disable_error: number
    user_leader_update_error: number
    user_uncreate: number  // 部门创建失败导致的用户未创建
    user_error: number
    // 公式一：user_error = user_add_error + user_leader_update_error + user_update_error + user_delete_error + user_enable_error + user_disable_error
    // 公式三-1：用户未同步至云文档数量 = user_add_error + user_uncreate (基于同步时勾选部分部门条件下进行统计)
    // 公式三-2: 用户未同步至云文档数量 = user_add_error + user_uncreate + drift_dept_user + drift_user (基于同步时勾选全部部门条件下进行统计)
    // 公式四：sync_user = user_add + user_add_error + user_update + user_update_error + user_update_ignore
  }
  dept: {
    total_dept: number
    scope_dept: number
    sync_dept: number
    drift_dept: number
    dept_delete: number
    dept_add: number
    dept_update: number
    dept_update_ignore: number
    dept_move: number
    dept_add_error: number  // 部门及子部门创建失败数
    dept_update_error: number
    dept_delete_error: number
    dept_move_error: number
    dept_error: number
    // 公式一：dept_error = dept_add_error + dept_delete_error + dept_move_error + dept_update_error
    // 公式三：sync_dept = dept_add + dept_update + dept_update_ignore + dept_update_error
  }
  dept_user: {
    total_dept_user: number
    scope_dept_user: number
    // sync_dept_user: number
    dept_user_delete: number
    dept_user_add: number
    // dept_user_sort: number
    // dept_user_update: number
    user_sort_or_main_dept_update: number
    dept_user_add_error: number
    dept_user_delete_error: number
    // dept_user_sort_error: number
    // dept_user_update_error: number
    user_sort_or_main_dept_update_error: number
    dept_user_error: number
    // 公式一: dept_user_error = dept_user_add_error + dept_user_delete_error + user_sort_or_main_dept_update_error
    // 公式二: sync_dept_user = dept_user_add + dept_user_add_error + user_sort_or_main_dept_update + user_sort_or_main_dept_update_error
  }
}

export interface IAnalyseErrorDetailReqParams {
  syncTbType: StatisticAnalyseTbType
  updateType: FullSyncUpdateType
  errType: StatisticAnalyseErrType
  content: string
}