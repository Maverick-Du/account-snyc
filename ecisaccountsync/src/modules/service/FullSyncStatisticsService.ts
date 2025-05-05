import {FullSyncTaskStatistics} from "../../sdk/account";
import {FullSyncTaskStatisticsSchema} from "../db/tables/FullSyncTaskStatistics";

export class FullSyncStatisticsService {

    newStatistics(taskId: string, companyId: string) {
        return {
            task_id: taskId,
            company_id: companyId,
            sync_user: 0,
            sync_dept: 0,
            sync_dept_set: new Set<string>(),
            sync_dept_user: 0,
            dept_add: 0,
            dept_add_error: 0,
            dept_update: 0,
            dept_update_error: 0,
            dept_update_set: new Set<string>(),
            dept_update_set_ignore: new Set<string>(),
            dept_update_ignore: 0,
            dept_delete: 0,
            dept_delete_error: 0,
            dept_move: 0,
            dept_move_error: 0,
            user_delete: 0,
            user_delete_error: 0,
            user_update: 0,
            user_update_error: 0,
            user_update_ignore: 0,
            user_add: 0,
            user_add_error: 0,
            user_enable: 0,
            user_enable_error: 0,
            user_disable: 0,
            user_disable_error: 0,
            user_leader_update: 0,
            user_leader_update_error: 0,
            dept_user_add: 0,
            dept_user_add_error: 0,
            dept_user_delete: 0,
            dept_user_delete_error: 0,
            dept_user_sort: 0,
            dept_user_sort_error: 0,
            user_dept_update: 0,
            user_dept_update_error: 0,
            dept_user_sort_update: 0,
            dept_user_sort_update_error: 0,
            user_error: 0,
            dept_error: 0,
            dept_user_error: 0,
            total_success: 0,
            total_error: 0
        } as FullSyncTaskStatistics
    }

    getStatistics(statistics: FullSyncTaskStatistics) {
        statistics.sync_dept = statistics.sync_dept_set.size
        statistics.dept_update = statistics.dept_update_set.size
        statistics.dept_update_ignore = statistics.dept_update_set_ignore.size
        statistics.total_error = statistics.user_error + statistics.dept_error + statistics.dept_user_error
        statistics.total_success = statistics.dept_add + statistics.dept_update + statistics.dept_delete + statistics.dept_move +
                   statistics.user_add + statistics.user_update + statistics.user_delete + statistics.user_enable + statistics.user_disable +
                   statistics.dept_user_add + statistics.dept_user_delete + statistics.user_dept_update;

        return {
            task_id: statistics.task_id,
            company_id: statistics.company_id,
            total_user: statistics.total_user,
            scope_user: statistics.scope_user,
            sync_user: statistics.sync_user,
            total_dept: statistics.total_dept,
            scope_dept: statistics.scope_dept,
            sync_dept: statistics.sync_dept,
            total_dept_user: statistics.total_dept_user,
            scope_dept_user: statistics.scope_dept_user,
            sync_dept_user: statistics.sync_dept_user,
            dept_add: statistics.dept_add,
            dept_add_error: statistics.dept_add_error,
            dept_update: statistics.dept_update,
            dept_update_error: statistics.dept_update_error,
            dept_update_ignore: statistics.dept_update_ignore,
            dept_delete: statistics.dept_delete,
            dept_delete_error: statistics.dept_delete_error,
            dept_move: statistics.dept_move,
            dept_move_error: statistics.dept_move_error,
            user_delete: statistics.user_delete,
            user_delete_error: statistics.user_delete_error,
            user_update: statistics.user_update,
            user_update_error: statistics.user_update_error,
            user_update_ignore: statistics.user_update_ignore,
            user_add: statistics.user_add,
            user_disable: statistics.user_disable,
            user_disable_error: statistics.user_disable_error,
            user_enable: statistics.user_enable,
            user_enable_error: statistics.user_enable_error,
            user_leader_update: statistics.user_leader_update,
            user_leader_update_error: statistics.user_leader_update_error,
            user_add_error: statistics.user_add_error,
            dept_user_add: statistics.dept_user_add,
            dept_user_add_error: statistics.dept_user_add_error,
            dept_user_delete: statistics.dept_user_delete,
            dept_user_delete_error: statistics.dept_user_delete_error,
            dept_user_sort: statistics.dept_user_sort,
            user_dept_update: statistics.user_dept_update,
            user_dept_update_error: statistics.user_dept_update_error,
            user_error: statistics.user_error,
            dept_error: statistics.dept_error,
            dept_user_error: statistics.dept_user_error,
            total_success: statistics.total_success,
            total_error: statistics.total_error,
        } as FullSyncTaskStatisticsSchema
    }
}

export default new FullSyncStatisticsService()
