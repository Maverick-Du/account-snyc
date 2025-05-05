import syncJobSettingService from "../service/SyncJobSettingService";
import {SyncJobSettingOpenStatus} from "../db/types";
import {ScheduleJobType, SyncJobContext} from "./ScheduleService";
import scheduleService from '../schedule/ScheduleService'
import {companyCfgService} from "../companyCfg";
import fullSyncTaskService from "../service/FullSyncTaskService";
import fullSync from "../sync/sync_full";
import sync from "../sync";
import {SyncJobSettingSchema} from "../db/tables/SyncJobSetting";
import updateScheduleJobService from './UpdateScheduleJobService'
import increment_sync from "../increment_sync";
import { log } from "../../sdk/cognac";


export class UpdateScheduleJobService {

    async rescheduleJob(cg: SyncJobSettingSchema) {
        let key = `${cg.company_id}_${cg.sync_type}`
        if (!scheduleService.jobs.has(key)) {
            if (cg.sync_type == ScheduleJobType.FULL_SYNC_JOB) {
                // 全量同步任务
                await updateScheduleJobService.initFullSyncJob(cg)
            } else if (cg.sync_type == ScheduleJobType.INCREMENT_SYNC_JOB) {
                // 增量同步任务
                await updateScheduleJobService.initIncrementSyncJob(cg)
            }
            log.i({ info: `init sync schedule job success! companyId: ${cg.company_id}, sync_type: ${cg.sync_type}, cron: ${cg.cron}` })
        } else {
            scheduleService.reschedule(cg.company_id, cg.sync_type, cg.cron)
        }
    }

    async initFullSyncJob(syncConfig: SyncJobSettingSchema) {
        if (syncConfig.open == SyncJobSettingOpenStatus.DISABLE) {
            return
        }
        let context: SyncJobContext = {company_id: syncConfig.company_id, sync_type: syncConfig.sync_type}
        scheduleService.scheduleJob(syncConfig.company_id, syncConfig.sync_type, syncConfig.cron, async () => {
            const cfg = await companyCfgService.getCfgByCompanyId(context.company_id)
            if (!cfg) {
                log.i(`FullSyncJob未找到对应的tb_company_cfg配置, 该租户的全量数据同步暂停, company_id: ${context.company_id}`)
                return
            }
            log.i({ info: `fullSync Schedule job start... companyId: ${cfg.companyId}` })
            let task = await fullSyncTaskService.getLatestToSyncTask(cfg.companyId)
            if (task) {
                await fullSync(sync.ctx, task.task_id, cfg)
            }
            log.i({ info: `fullSync Schedule job end... companyId: ${cfg.companyId}` })
        })
    }

    async initIncrementSyncJob(syncConfig: SyncJobSettingSchema) {
        if (syncConfig.open == SyncJobSettingOpenStatus.DISABLE) {
            return
        }
        let context: SyncJobContext = {company_id: syncConfig.company_id, sync_type: syncConfig.sync_type}
        scheduleService.scheduleJob(syncConfig.company_id, syncConfig.sync_type, syncConfig.cron, async () => {
            const cfg = await companyCfgService.getCfgByCompanyId(context.company_id)
            if (!cfg) {
                log.i(`IncrementSyncJob未找到对应的tb_company_cfg配置, 该租户的增量数据同步暂停, company_id: ${context.company_id}`)
                return
            }
            log.i({ info: `increment sync job start... companyId: ${cfg.companyId}` })
            let conf = await syncJobSettingService.getSyncConfig(cfg.companyId, ScheduleJobType.INCREMENT_SYNC_JOB)
            if (!conf) {
                log.e(`increment sync end. reason: not found schedule job config. companyId: ${cfg.companyId}`)
                return
            }
            if (conf.open == SyncJobSettingOpenStatus.DISABLE) {
                log.i({ info: `increment sync end. reason: schedule job config is disable. companyId: ${cfg.companyId}`})
                return
            }
            await increment_sync.start(cfg, conf.sync_time)
            log.i({ info: `increment sync job end... companyId: ${cfg.companyId}` })
        })
    }
}
export default new UpdateScheduleJobService()
