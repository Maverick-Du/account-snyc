
export enum FullSyncCommon {
    TASK_ID_FORMAT = "yyyyMMddHHmmss",
}


export enum WpsApiErrorCode {
    DeptNameExists = "400002010"
}

export enum WpsApiErrorMsg {
    DeptNameExists = "DeptNameExists"
}

export enum CommonErrorName {
    TaskCancel = "TaskCancelError",
    TaskScopeAbsence = "TaskScopeAbsence",
    TaskDeleteThreshold = "TaskDeleteThreshold",
    TaskError = "TaskError"
}

export class TaskStopError implements Error {
    taskId: string
    name: string
    message: string

    constructor(taskId: string, name: string, msg: string) {
        this.taskId = taskId
        this.name = name
        this.message = msg
    }
}

export interface StopTaskEntity {
    taskId: string
    companyId: string
    name: string
    msg: string
}
