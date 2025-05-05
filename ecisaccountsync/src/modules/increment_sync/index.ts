import {IncrementSyncEngine} from "./strategy/IncrementSyncEngine";
import {lockService} from "../lock";
import {LockKey} from "../lock/LockService";
import syncJobSettingService from '../service/SyncJobSettingService'
import {ScheduleJobType} from "../schedule/ScheduleService";
import {format, parse} from 'date-fns';
import {CompanyCfg} from "../../sdk/account";
import {IncrementSyncContext} from "./strategy/types";
import config from "../../common/config";
import increment_sync from '../../modules/increment_sync'
import las from "../service/LasIncrementService";
import {IncrementSyncErrorStrategyType, IncrementSyncTaskStatistics, ISyncCommon} from "./types";
import {LasDeptIncrementSchema} from "../db/tables/LasDepartmentIncrement";
import {LasUserIncrementSchema} from "../db/tables/LasUserIncrement";
import {LasDeptUserIncrementSchema} from "../db/tables/LasDepartmentUserIncrement";
import {companyCfgService} from "../companyCfg";
import {IncrementSyncType} from "../admin/type";
import {IncrementStatus} from "../db/types";
import {Result} from "../../common/type";
import { log } from "../../sdk/cognac";

export default new (class {
    engine: IncrementSyncEngine

    init() {
        this.engine = new IncrementSyncEngine()
        this.engine.init()
    }

    async start(cfg: CompanyCfg, sync_time: string) {
        let lockId = 0
        let lockKey = `${LockKey.BATCH_SYNC}_${cfg.companyId}`
        let ctx: IncrementSyncContext = null
        let endTime: string = null
        let etime = new Date().getTime()/1000 + config.incrementLockEtime
        try {
            lockId = await lockService.tryLock(lockKey, `${lockKey}_INCREMENT_SYNC`, etime)
            if (lockId <= 0) {
                log.i({ info: `increment sync end. reason: not get lock, companyId: ${cfg.companyId}`})
                return
            }
            let startTime = sync_time || ISyncCommon.INIT_START_TIME
            endTime = await this.generateSyncTime(cfg.thirdCompanyId, startTime)

            let deptData = await las.queryDeptSyncData(cfg.thirdCompanyId, startTime, endTime)
            let userData = await las.queryUserSyncData(cfg.thirdCompanyId, startTime, endTime)
            let deptUserData = await las.queryDeptUserSyncData(cfg.thirdCompanyId, startTime, endTime)
            if (deptData.length == 0 && userData.length == 0 && deptUserData.length == 0) {
                log.i({ info: `increment sync end. reason: not found data, companyId: ${cfg.companyId}, startTime: ${startTime}, endTime: ${endTime}`})
               return
            }
            log.i({ info: `increment sync start... companyId: ${cfg.companyId}, startTime: ${startTime}, endTime: ${endTime}, deptSize: ${deptData.length}, userSize: ${userData.length}, deptUserSize: ${deptUserData.length}`})
            ctx = this.buildIncrementSyncContext(cfg, startTime, endTime)
            await this.engine.start(ctx, deptData, userData, deptUserData)
            await this.handleIncrementSyncErrorStrategy(ctx, endTime)
        } catch (err) {
            err.msg = `increment sync throw increment_sync_error. companyId: ${cfg.companyId}, msg: ${err.message}`
            log.error(err)
        } finally {
            if (lockId > 0) {
                await lockService.releaseLock(lockId, lockKey)
            }
            await syncJobSettingService.updateEndTime(cfg.companyId, ScheduleJobType.INCREMENT_SYNC_JOB, format(new Date(), ISyncCommon.TIME_FORMAT))
            await this.printIncrementSyncStatistics(ctx)
        }
    }

    async retry(companyId: string, id: number, type: IncrementSyncType) {
        let lockId = 0
        let lockKey = `${LockKey.BATCH_SYNC}_${companyId}`
        let etime = new Date().getTime()/1000 + config.incrementLockEtime
        try {
            let cfg = await companyCfgService.getCfgByCompanyId(companyId)
            if (!cfg) {
                log.i(`increment retry sync未找到对应的tb_company_cfg配置, 重试失败, id: ${id}, type: ${type}`)
                return new Result(Result.FAIL_CODE, `未找到对应的tb_company_cfg配置, companyId: ${companyId}`)
            }
            lockId = await lockService.tryLock(lockKey, `${lockKey}_INCREMENT_SYNC`, etime)
            if (lockId <= 0) {
                log.i({ info: `increment retry sync end. reason: not get lock, companyId: ${companyId}`})
                return new Result(Result.FAIL_CODE, "重试任务正在等待执行，请稍后查看同步结果")
            }
            let deptData: LasDeptIncrementSchema[] = []
            let userData: LasUserIncrementSchema[] = []
            let deptUserData: LasDeptUserIncrementSchema[] = []
            if (type == IncrementSyncType.DEPT) {
                let data = await las.getDeptIncrementDetail(id, cfg.thirdCompanyId)
                if (!data) {
                    return new Result(Result.FAIL_CODE, `未找到该增量数据，id: ${id}, type: ${type}`)
                }
                if (data.status == IncrementStatus.SUCCESS) {
                    return new Result(Result.SUCCESS_CODE, "同步成功", { id: id })
                }
                deptData.push(data)
            } else if (type == IncrementSyncType.USER) {
                let data = await las.getUserIncrementDetail(id, cfg.thirdCompanyId)
                if (!data) {
                    return new Result(Result.FAIL_CODE, `未找到该增量数据，id: ${id}, type: ${type}`)
                }
                if (data.status == IncrementStatus.SUCCESS) {
                    return new Result(Result.SUCCESS_CODE, "同步成功", { id: id })
                }
                userData.push(data)
            } else if (type == IncrementSyncType.USER_DEPT) {
                let data = await las.getDeptUserIncrementDetail(id, cfg.thirdCompanyId)
                if (!data) {
                    return new Result(Result.FAIL_CODE, `未找到该增量数据，id: ${id}, type: ${type}`)
                }
                if (data.status == IncrementStatus.SUCCESS) {
                    return new Result(Result.SUCCESS_CODE, "同步成功", { id: id })
                }
                deptUserData.push(data)
            } else {
                return new Result(Result.FAIL_CODE, `未知的type: ${type}`)
            }
            let ctx = this.buildIncrementSyncContext(cfg, null, null)
            await this.engine.start(ctx, deptData, userData, deptUserData)
            return new Result(Result.SUCCESS_CODE, "同步成功", { id: id })
        } catch (er) {
            er.msg = `increment retry sync throw error. companyId: ${companyId}, msg: ${er.message}`
            log.i(er)
            return new Result(Result.FAIL_CODE, `同步失败，msg: ${er.message}`)
        } finally {
            if (lockId > 0) {
                await lockService.releaseLock(lockId, lockKey)
            }
        }
    }

    // startTime endTime时间间隔单表最大1000条，避免数据量过大导致内存溢出
    async generateSyncTime(thirdCompanyId: string, startTime: string) {
        let now = new Date().getTime()
        let userMaxTime: number
        let deptMaxTime: number
        let deptUserMaxTime: number
        let userDataNum = await las.countUserSyncDataNum(thirdCompanyId, startTime, format(new Date(now), ISyncCommon.SYNC_TIME_FORMAT))
        if (userDataNum > config.incrementMaxNum) {
            let maxEndTime = await las.getUserMaxEndTime(thirdCompanyId, startTime, config.incrementMaxNum)
            if (maxEndTime) {
                log.i(`increment generateSyncTime getUserMaxEndTime maxEndTime: ${maxEndTime.getTime()}`)
                userMaxTime = maxEndTime.getTime()
            }
        }
        let deptDataNum = await las.countDeptSyncDataNum(thirdCompanyId, startTime, format(new Date(now), ISyncCommon.SYNC_TIME_FORMAT))
        if (deptDataNum > config.incrementMaxNum) {
            let maxEndTime = await las.getDeptMaxEndTime(thirdCompanyId, startTime, config.incrementMaxNum)
            if (maxEndTime) {
                log.i(`increment generateSyncTime getDeptMaxEndTime maxEndTime: ${maxEndTime.getTime()}`)
                deptMaxTime = maxEndTime.getTime()
            }
        }
        let deptUserDataNum = await las.countDeptUserSyncDataNum(thirdCompanyId, startTime, format(new Date(now), ISyncCommon.SYNC_TIME_FORMAT))
        if (deptUserDataNum > config.incrementMaxNum) {
            let maxEndTime = await las.getDeptUserMaxEndTime(thirdCompanyId, startTime, config.incrementMaxNum)
            if (maxEndTime) {
                log.i(`increment generateSyncTime getDeptUserMaxEndTime maxEndTime: ${maxEndTime.getTime()}`)
                deptUserMaxTime = maxEndTime.getTime()
            }
        }
        if (userMaxTime > 0) {
            now = Math.min(userMaxTime, now);
        }
        if (deptMaxTime > 0) {
            now = Math.min(deptMaxTime, now);
        }
        if (deptUserMaxTime > 0) {
            now = Math.min(deptUserMaxTime, now);
        }
        return format(new Date(now), ISyncCommon.SYNC_TIME_FORMAT)
    }

    buildIncrementSyncContext(cfg: CompanyCfg, startTime: string, endTime: string) {
        return {
            engine: increment_sync.engine,
            cfg: cfg,
            startTime: startTime,
            endTime: endTime,
            statistics: {
                total: 0,
                dept_add: 0,
                dept_delete: 0,
                dept_update: 0,
                dept_move: 0,
                user_add: 0,
                user_delete: 0,
                user_update: 0,
                user_dept_add: 0,
                user_dept_delete: 0,
                user_dept_sort_update: 0,
                user_dept_main_update: 0,
                user_fail: 0,
                dept_fail: 0,
                user_dept_fail: 0,
            } as IncrementSyncTaskStatistics
        } as IncrementSyncContext
    }

    async printIncrementSyncStatistics(ctx: IncrementSyncContext) {
        if (ctx) {
            let statistics = ctx.statistics
            if (statistics.user_fail > 0 || statistics.dept_fail > 0 || statistics.user_dept_fail > 0) {
                let msg = `increment_sync_exist_error, 增量同步存在部分数据同步失败. 详细如下: companyId: ${ctx.cfg.thirdCompanyId}, startTime: ${ctx.startTime}, endTime: ${ctx.endTime
                }, userFail: ${ctx.statistics.user_fail}, deptFail: ${ctx.statistics.dept_fail}, deptUserFail: ${ctx.statistics.user_dept_fail}`
                log.e(msg)
            }
            log.i({info: `increment sync end. companyId: ${ctx.cfg.thirdCompanyId}, startTime: ${ctx.startTime}, endTime: ${ctx.endTime}, statistics: ${JSON.stringify(ctx.statistics)}`})
        }
    }

    async handleIncrementSyncErrorStrategy(ctx: IncrementSyncContext, endTime: string) {
        let statistics = ctx.statistics
        if (statistics.user_fail > 0 || statistics.dept_fail > 0 || statistics.user_dept_fail > 0) {
            if (config.strategy.increment_error_strategy == IncrementSyncErrorStrategyType.SKIP) {
                await syncJobSettingService.updateSyncTime(ctx.cfg.companyId, ScheduleJobType.INCREMENT_SYNC_JOB, endTime)
            }
        } else {
            await syncJobSettingService.updateSyncTime(ctx.cfg.companyId, ScheduleJobType.INCREMENT_SYNC_JOB, endTime)
        }
    }

})
