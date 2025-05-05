
export enum FullSyncTaskMetricTitle {
    WARN_TITLE = "[账号同步]全量同步触发告警，请确认风险后再同步!",
    ERROR_TITLE = "[账号同步]全量同步异常中断，请确认风险后再同步!",
    ERROR_DATA_TITLE = "[账号同步]全量同步部分数据异常，请确认风险!"
}

export interface FullSyncMetricData {
    service: string,
    taskId: string,
    companyId: string,
    title: FullSyncTaskMetricTitle,
    msg: string
}

export enum IncrementSyncMetricTitle {
    ERROR_DATA_TITLE = "[账号同步]增量同步部分数据异常，请确认风险!"
}

export interface IncrementSyncMetricData {
    service: string,
    companyId: string,
    startTime: string,
    endTime: string,
    title: IncrementSyncMetricTitle,
    user_fail: number,
    dept_fail: number,
    dept_user_fail: number,
    msg: string,
}
