/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"

export interface FullSyncTaskStatisticsSchema {
  id: number,
  task_id: string,
  company_id: string,
  total_user: number,
  scope_user: number,
  sync_user: number,
  total_dept: number,
  scope_dept: number,
  sync_dept: number,
  total_dept_user: number,
  scope_dept_user: number,
  sync_dept_user: number,
  dept_add: number,
  dept_add_error: number,
  dept_update: number,
  dept_update_ignore: number,
  dept_update_error: number,
  dept_delete: number,
  dept_delete_error: number,
  dept_move: number,
  dept_move_error: number,
  user_delete: number,
  user_delete_error: number,
  user_update: number,
  user_update_error: number,
  user_update_ignore: number,
  user_add: number,
  user_add_error: number,
  user_leader_update: number,
  user_leader_update_error: number,
  user_enable: number,
  user_enable_error: number,
  user_disable: number,
  user_disable_error: number,
  dept_user_add: number,
  dept_user_add_error: number,
  dept_user_delete: number,
  dept_user_delete_error: number,
  dept_user_sort: number,
  user_dept_update: number,
  user_dept_update_error: number,
  user_error: number,
  dept_error: number,
  dept_user_error: number,
  total_success: number,
  total_error: number,
  ctime: number
  mtime: number
}

export class FullSyncTaskStatisticsTable extends Table<FullSyncTaskStatisticsSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_full_sync_task_statistics')
  }

  async querySyncData(taskId: string, companyId: string): Promise<FullSyncTaskStatisticsSchema> {
    return this.get('task_id = ? and company_id = ?', taskId, companyId).query()
  }

  async queryFullSyncTaskDetail(taskId: string, companyId: string) {
    return this.db.select('select sync_type, status, operator, collect_cost, begin_time, end_time, error_msg, b.id as bid, a.* from tb_full_sync_task b left join tb_full_sync_task_statistics a on a.task_id = b.task_id  where b.task_id = ? and b.company_id = ? limit 1 offset 0', [taskId, companyId])
  }

  async addFullSyncTaskStatistics(ovs: Partial<FullSyncTaskStatisticsSchema>): Promise<number> {
    return this.add(ovs).query()
  }

  async updateFullSyncTaskStatistics(ovs: Partial<FullSyncTaskStatisticsSchema>): Promise<string> {
    return this.update({
      sync_user: ovs.sync_user,
      sync_dept: ovs.sync_dept,
      sync_dept_user: ovs.sync_dept_user,
      dept_add: ovs.dept_add,
      dept_add_error: ovs.dept_add_error,
      dept_update: ovs.dept_update,
      dept_update_ignore: ovs.dept_update_ignore,
      dept_update_error: ovs.dept_update_error,
      dept_delete: ovs.dept_delete,
      dept_delete_error: ovs.dept_delete_error,
      dept_move: ovs.dept_move,
      dept_move_error: ovs.dept_move_error,
      user_delete: ovs.user_delete,
      user_delete_error: ovs.user_delete_error,
      user_update: ovs.user_update,
      user_update_error: ovs.user_update_error,
      user_update_ignore: ovs.user_update_ignore,
      user_add: ovs.user_add,
      user_add_error: ovs.user_add_error,
      user_disable: ovs.user_disable,
      user_disable_error: ovs.user_disable_error,
      user_enable: ovs.user_enable,
      user_enable_error: ovs.user_enable_error,
      user_leader_update: ovs.user_leader_update,
      user_leader_update_error: ovs.user_leader_update_error,
      dept_user_add: ovs.dept_user_add,
      dept_user_add_error: ovs.dept_user_add_error,
      dept_user_delete: ovs.dept_user_delete,
      dept_user_delete_error: ovs.dept_user_delete_error,
      dept_user_sort: ovs.dept_user_sort,
      user_dept_update: ovs.user_dept_update,
      user_dept_update_error: ovs.user_dept_update_error,
      dept_error: ovs.dept_error,
      user_error: ovs.user_error,
      dept_user_error: ovs.dept_user_error,
      total_success: ovs.total_success,
      total_error: ovs.total_error
    }).where('task_id=? and company_id=?', ovs.task_id, ovs.company_id).query()
  }
}
