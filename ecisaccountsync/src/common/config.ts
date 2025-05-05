import * as dotenv from 'dotenv'
import {IncrementSyncDeptNameConflict, IncrementSyncErrorStrategyType} from "../modules/increment_sync/types";
import { getAkSk } from './util';
dotenv.config()

interface Config {
    port: number
    appId: string
    appKey: string
    appName: string
    logLevel: string
    componentId: string
    isAuth: string
    saveDataSize: number
    saveDataDay: number
    groupSize: number
    pageSize: number
    asyncSize: number
    httpRetryCode: number[]
    splitSymbol: string
    salt: string
    regionId: string
    incrementMaxNum: number
    statisticsTaskId: string
    caseSensitive: number
    incrementLockEtime: number
    sqlRetryNum: number
    strategy: {
        increment_error_strategy: string
        dept_name_conflict: string
    }
    errorRetry: {
        open: number
        idle: number
    }
    schedule: {
        fullJobCron: string
        incrementCron: string
        clearCron: string
    }
    threshold: {
        userDel: number
        deptDel: number
        deptUserDel: number
    }
    db1: {
        name: string
        host: string
        port: string
        user: string
        password: string
        database: string
    }
    db2: {
        name: string
        host: string
        port: string
        user: string
        password: string
        database: string
    }
    cloud: {
        host: string
        isMultiTenant: string
        defaultCompanyId: string
        defaultPassword: string
    },
    open: {
        host: string
    },
    cams: {
        host: string
    },
    metric: {
        pushGateway_host: string
        pushGateway_port: number
        pgw_user: string
        pgw_passwd_str: string
        pgw_passwd: string
    }
}

const { ak, sk } = getAkSk()

const config: Config = {
    port: process.env.HTTP_KPORT ? parseInt(process.env.HTTP_KPORT) : 8000,
    appId: ak,
    appKey: sk,
    appName: process.env.APP_NAME ? process.env.APP_NAME : '账号同步',
    logLevel: process.env.logLevel,
    componentId: process.env.componentId ? process.env.componentId : "ecisaccountsync",
    isAuth: process.env.isAuth ? process.env.isAuth : "true",
    saveDataSize: process.env.saveDataSize ? parseInt(process.env.saveDataSize) : 3000000,
    saveDataDay: process.env.saveDataDay ? parseInt(process.env.saveDataDay) : 90,
    groupSize: process.env.batchSize ? parseInt(process.env.groupSize) : 50,
    pageSize: process.env.batchSize ? parseInt(process.env.pageSize) : 1000,
    asyncSize: process.env.asyncSize ? parseInt(process.env.asyncSize) : 20,
    httpRetryCode: process.env.httpRetryCode ? process.env.httpRetryCode.split(",").map(s => parseInt(s)) : [400000005, 50000001],
    splitSymbol: process.env.splitSymbol ? process.env.splitSymbol : "@@",
    salt: process.env.salt,
    regionId: "default_region",
    incrementMaxNum: parseInt(process.env.INCREMENT_MAX_NUM) || 1000,
    statisticsTaskId: process.env.statisticsTaskId || "20241227000546",
    caseSensitive: process.env.CASE_SENSITIVE ? parseInt(process.env.CASE_SENSITIVE) : 0,
    incrementLockEtime: process.env.incrementLockEtime ? parseInt(process.env.incrementLockEtime) : 3600,
    sqlRetryNum: process.env.SQL_RETRY_NUM ? parseInt(process.env.SQL_RETRY_NUM) : 0,
    strategy: {
        increment_error_strategy: process.env.INCREMENT_ERROR_STRATEGY || IncrementSyncErrorStrategyType.SKIP,
        dept_name_conflict: process.env.DEPT_NAME_CONFLICT || IncrementSyncDeptNameConflict.FAIL
    },
    schedule: {
        fullJobCron: process.env.fullJobCron || '55 * * * * ?', //每分钟的55秒执行
        incrementCron: process.env.incrementCron || '0 0/10 * * * ?', //每10分钟执行
        clearCron: process.env.clearCron || '0 0 0 * * ?', //每晚0点执行
    },
    errorRetry: {
        open: process.env.retryOpen ? parseInt(process.env.retryOpen) : 0,
        idle: process.env.retryIdle ? parseInt(process.env.retryIdle) : 1,
    },
    threshold: {
        userDel: process.env.userDel ? parseInt(process.env.userDel) : 200,
        deptDel: process.env.deptDel ? parseInt(process.env.deptDel) : 20,
        deptUserDel: process.env.deptUserDel ? parseInt(process.env.deptUserDel) : 1,
    },
    db1: {
        name: "db",
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || "3306",
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE,
    },
    db2: {
        name: "self",
        host: process.env.SELF_DB_HOST,
        port: process.env.SELF_DB_PORT || "3306",
        user: process.env.SELF_DB_USER,
        password: process.env.SELF_DB_PASSWORD || '',
        database: process.env.SELF_DB_DATABASE
    },
    cloud: {
        host: process.env.CLOUD_HOST || "http://encs-pri-cams-engine/i/docmini",
        isMultiTenant: process.env.CAMS_IS_MULTI_TENANT ? process.env.CAMS_IS_MULTI_TENANT : "false",
        defaultCompanyId: process.env.CAMS_PLATFORM_COMPANY_ID,
        defaultPassword: process.env.DEFAULT_PASSWORD || "Wps@Yhdy@123"
    },
    open: {
        host: process.env.OPEN_HOST || "http://encs-pri-open-gateway"
    },
    cams: {
        host: process.env.CAMS_HOST || "http://encs-pri-cams-engine/i/cams"
    },
    metric: {
        pushGateway_host: process.env.SRE_PUSHGATEWAY_HOST,
        pushGateway_port: process.env.SRE_PUSHGATEWAY_PORT ? parseInt(process.env.SRE_PUSHGATEWAY_PORT) : 0,
        pgw_user: process.env.PGW_USER,
        pgw_passwd_str: process.env.PGW_PASSWD,
        pgw_passwd: process.env.PGW_PASSWD,
    }

}

export default config
