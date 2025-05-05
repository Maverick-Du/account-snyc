import {IDatabase} from "../../sdk/cognac/orm";
import {FullSyncTaskSchema, FullSyncTaskTable} from "../db/tables/FullSyncTask";
import {FullSyncTaskStatisticsSchema, FullSyncTaskStatisticsTable} from "../db/tables/FullSyncTaskStatistics";
import {FullSyncStatus, SyncType} from "../db/types";
import {StopTaskEntity, TaskStopError} from "../sync/types";

export class FullSyncTaskService {
    private db: IDatabase

    private fullSyncTaskTable: FullSyncTaskTable
    private fullSyncTaskStatisticsTable: FullSyncTaskStatisticsTable
    private stopTaskMap: Map<string, StopTaskEntity>

    init(db: IDatabase) {
        this.db = db
        this.fullSyncTaskTable = new FullSyncTaskTable(this.db)
        this.fullSyncTaskStatisticsTable = new FullSyncTaskStatisticsTable(this.db)
        this.stopTaskMap = new Map<string, StopTaskEntity>()
    }

    async createTask(schema: FullSyncTaskSchema) {
        if (!schema.task_id || !schema.company_id || !schema.operator) {
            throw new Error("createTask param empty")
        }
        return this.fullSyncTaskTable.addTask(schema)
    }

    async getTask(taskId: string, companyId: string) {
        return this.fullSyncTaskTable.getTask(taskId, companyId)
    }

    async getLatestToSyncTask(companyId: string) {
        return this.fullSyncTaskTable.getLatestToSyncTask(companyId)
    }

    async getLatestTask(companyId: string) {
        return this.fullSyncTaskTable.getLatestTask(companyId)
    }

    async checkContinueTask(originId: number, companyId: string) {
        return this.fullSyncTaskTable.checkContinueTask(originId, companyId)
    }

    async checkTaskCanRun(id: number, companyId: string) {
        return this.fullSyncTaskTable.checkTaskCanRun(id, companyId)
    }

    async checkRetryTaskCanRun(originId: number, companyId: string, id: number) {
        return this.fullSyncTaskTable.checkRetryTaskCanRun(originId, companyId, id)
    }

    async cancelBeforeTask(id: number, companyId: string, msg: string) {
        return this.fullSyncTaskTable.cancelBeforeTask(id, companyId, msg)
    }

    async failAllSyncingTask(regionId: string) {
        return this.fullSyncTaskTable.failAllSyncingTask(regionId, `服务重启，任务终止`)
    }

    /**
     * 取消任务
     * @param taskId
     * @param companyId
     * @param msg 'xxx于xxx时间取消任务'
     */
    async cancelTask(taskId: string, companyId: string, msg: string) {
        return this.fullSyncTaskTable.cancelTask(taskId, companyId, msg)
    }

    async resetTask(taskId: string, companyId: string, operator: string) {
        return this.fullSyncTaskTable.resetTask(taskId, companyId, operator)
    }

    /**
     * 终止任务
     */
    async stopTask(entity: StopTaskEntity) {
        this.stopTaskMap.set(`${entity.taskId}_${entity.companyId}`, entity)
        // await this.endTask(taskId, thirdCompanyId, FullSyncStatus.SYNC_CANCEL, new Date(), msg)
    }

    checkTaskIsNeedStop(taskId: string, companyId: string) {
        let entity = this.stopTaskMap.get(`${taskId}_${companyId}`) || null
        if (entity) {
            this.stopTaskMap.delete(`${taskId}_${companyId}`)
            throw new TaskStopError(taskId, entity.name, entity.msg)
        }
    }

    async startTask(taskId: string, companyId: string, beginTime: Date, regionId: string) {
        return this.fullSyncTaskTable.startTask(taskId, companyId, beginTime, regionId)
    }

    async endTask(taskId: string, companyId: string, status: FullSyncStatus, endTime: Date, msg: string, scopeVersion: number) {
        return this.fullSyncTaskTable.endTask(taskId, companyId, status, endTime, msg, scopeVersion)
    }

    async querySyncingTask() {
        return this.fullSyncTaskTable.querySyncingTask()
    }

    async checkIsRetryTaskId(taskId: string, companyId: string) {
        if (!taskId) {
            throw new Error("checkIsRetryTaskId taskId is empty")
        }
        let task = await this.getTask(taskId, companyId)
        if (!task) {
            throw new Error(`not found task data. taskId: ${taskId}`)
        }
        return task.sync_type == SyncType.MANUAL || task.sync_type == SyncType.ROLLRETRY
    }

    handleRetryTaskId(taskId: string) {
        if (!taskId) {
            throw new Error("handleRetryTaskId taskId is empty")
        }
        if (taskId.indexOf("_") >= 0) {
            let arr = taskId.split("_")
            let num = Number(arr[1]) + 1
            return `${arr[0]}_${num}`
        } else {
            return `${taskId}_1`
        }
    }

    getOriginTaskId(taskId: string) {
        if (taskId.indexOf("_") < 0) {
            return taskId
        }
        let arr = taskId.split("_")
        return arr[0]
    }

    getPreviousTaskId(taskId: string) {
        if (taskId.indexOf("_") < 0) {
            return taskId
        }
        let arr = taskId.split("_")
        let task = arr[0]
        let fix = Number(arr[1])
        if (fix == 1) {
            return task
        } else {
            return `${task}_${fix - 1}`
        }
    }

    async getFullSyncStatisticData(taskId: string, companyId: string) {
        return this.fullSyncTaskStatisticsTable.querySyncData(taskId, companyId)
    }

    async saveStatistics(data: FullSyncTaskStatisticsSchema) {
        return this.fullSyncTaskStatisticsTable.addFullSyncTaskStatistics(data)
    }

    async updateStatistics(data: FullSyncTaskStatisticsSchema) {
        return this.fullSyncTaskStatisticsTable.updateFullSyncTaskStatistics(data)
    }

    async getLatestRetryFullSyncTask(companyId: string, rootTaskId: string) {
        return this.fullSyncTaskTable.queryLatestRetryFullSyncTask(companyId, rootTaskId)
    }
}

export default new FullSyncTaskService()
