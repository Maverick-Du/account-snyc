import {SyncJobSettingOpenStatus, SyncJobSettingRateType} from "../db/types";
import {SyncJobSettingSchema, SyncJobSettingTable} from "../db/tables/SyncJobSetting";
import {IDatabase} from "../../sdk/cognac/orm";
import schedule, {ScheduleJobType} from '../schedule/ScheduleService'
import updateScheduleJobService from '../schedule/UpdateScheduleJobService'
import config from "../../common/config";
import {FullSyncScopeVersionTable} from "../db/tables/FullSyncScopeVersion";

export class SyncJobSettingService {
    private db: IDatabase
    private syncJobSettingTable: SyncJobSettingTable
    private fullSyncScopeVersionTable: FullSyncScopeVersionTable

    init(db: IDatabase) {
        this.db = db
        this.syncJobSettingTable = new SyncJobSettingTable(db)
        this.fullSyncScopeVersionTable = new FullSyncScopeVersionTable(db)
    }

    async getSyncConfig(companyId: string, type: ScheduleJobType) {
        return this.syncJobSettingTable.getSyncConfig(companyId, type)
    }

    async getAllSyncConfig() {
        return this.syncJobSettingTable.getAllConfigs()
    }

    async getSyncConfigs(type: ScheduleJobType) {
        return this.syncJobSettingTable.getSyncConfigs(type)
    }

    async updateSyncConfig(ovs: Partial<SyncJobSettingSchema>): Promise<boolean> {
        let cg = await this.getSyncConfig(ovs.company_id, ovs.sync_type)
        if (!cg) {
            throw new Error(`not found SyncJobSetting. sync_type:${ovs.sync_type}`)
        }
        let res = await this.syncJobSettingTable.updateSyncConfig(ovs)
        if (!res || res <= 0) {
            return false
        }
        if ((cg.open != ovs.open || cg.cron != ovs.cron) && ovs.open == SyncJobSettingOpenStatus.ENABLE) {
            let conf = await this.getSyncConfig(ovs.company_id, ovs.sync_type)
            await updateScheduleJobService.rescheduleJob(conf)
        }
        if ((cg.open != ovs.open || cg.cron != ovs.cron) && ovs.open == SyncJobSettingOpenStatus.DISABLE) {
            schedule.cancel(ovs.company_id, ovs.sync_type)
        }
        return true
    }

    async reopenSyncJob(company_id: string) {
        let fullConfig = await this.syncJobSettingTable.getSyncConfig(company_id, ScheduleJobType.FULL_SYNC_JOB)
        if (fullConfig && fullConfig.open == SyncJobSettingOpenStatus.DISABLE) {
            fullConfig.open = SyncJobSettingOpenStatus.ENABLE
            await this.updateSyncConfig(fullConfig)
        }
        let incrementConfig = await this.syncJobSettingTable.getSyncConfig(company_id, ScheduleJobType.INCREMENT_SYNC_JOB)
        if (incrementConfig && incrementConfig.open == SyncJobSettingOpenStatus.DISABLE) {
            incrementConfig.open = SyncJobSettingOpenStatus.ENABLE
            await this.updateSyncConfig(incrementConfig)
        }
    }

    async stopSyncJob(company_id: string) {
        let fullConfig = await this.syncJobSettingTable.getSyncConfig(company_id, ScheduleJobType.FULL_SYNC_JOB)
        if (fullConfig && fullConfig.open == SyncJobSettingOpenStatus.ENABLE) {
            fullConfig.open = SyncJobSettingOpenStatus.DISABLE
            await this.updateSyncConfig(fullConfig)
        }
        let incrementConfig = await this.syncJobSettingTable.getSyncConfig(company_id, ScheduleJobType.INCREMENT_SYNC_JOB)
        if (incrementConfig && incrementConfig.open == SyncJobSettingOpenStatus.ENABLE) {
            incrementConfig.open = SyncJobSettingOpenStatus.DISABLE
            await this.updateSyncConfig(incrementConfig)
        }
    }

    async updateSyncTime(company_id: string, sync_type: ScheduleJobType, sync_time: string) {
        return this.syncJobSettingTable.updateSyncTime(company_id, sync_type, sync_time)
    }

    async updateEndTime(company_id: string, sync_type: ScheduleJobType, end_time: string) {
        if (end_time) {
            return this.syncJobSettingTable.updateEndTime(company_id, sync_type, end_time)
        }
    }

    async initFullSyncConfig(company_id: string) {
        let cg = {
            company_id: company_id,
            sync_type: ScheduleJobType.FULL_SYNC_JOB,
            sync_time: '',
            open: SyncJobSettingOpenStatus.DISABLE,
            rate: 1,
            type: SyncJobSettingRateType.MIN,
            cron: config.schedule.fullJobCron
        } as SyncJobSettingSchema
        await this.syncJobSettingTable.addSyncConfig(cg)
        await this.fullSyncScopeVersionTable.addConfig({company_id: company_id, scope_version: 1})
    }

    async initIncrementSyncConfig(company_id: string) {
        let icg = {
            company_id: company_id,
            sync_type: ScheduleJobType.INCREMENT_SYNC_JOB,
            sync_time: '',
            open: SyncJobSettingOpenStatus.DISABLE,
            rate: 10,
            type: SyncJobSettingRateType.MIN,
            cron: config.schedule.incrementCron
        } as SyncJobSettingSchema
        await this.syncJobSettingTable.addSyncConfig(icg)
    }
}

export default new SyncJobSettingService()
