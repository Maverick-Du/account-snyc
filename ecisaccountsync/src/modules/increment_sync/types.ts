
export enum ISyncCommon {
    // 初始任务起始时间
    INIT_START_TIME = "2024-07-01 00:00:00",
    TIME_FORMAT = "yyyyMMddHHmmss",
    SYNC_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss",
    // 增量最大数据量，大于这个数据时，以7天为间隔进行同步
    MAX_DATA_NUM = 1000,
}

export enum IncrementSyncErrorStrategyType {
    INTERRUPT = "interrupt",
    SKIP = "skip"
}

export enum IncrementSyncDeptNameConflict {
    FAIL = "fail",
    RENAME = "rename"
}

export interface IncrementSyncTaskStatistics {
    total: number
    dept_add: number
    dept_delete: number
    dept_update: number
    dept_move: number
    user_add: number
    user_delete: number
    user_update: number
    user_dept_add: number
    user_dept_delete: number
    user_dept_sort_update: number
    user_dept_main_update: number
    user_fail: number
    dept_fail: number
    user_dept_fail: number
}
