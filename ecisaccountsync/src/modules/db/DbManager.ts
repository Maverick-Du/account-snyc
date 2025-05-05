import config from "../../common/config";
import {companyCfgService} from "../companyCfg";
import {lockService} from "../lock";
import lasIncrementService from '../service/LasIncrementService'
import lasAdminService from "../service/LasAdminService";
import fullSyncTaskService from '../service/FullSyncTaskService'
import fullSyncScopeService from '../service/FullSyncScopeService'
import syncJobSettingService from '../service/SyncJobSettingService'
import fullSyncDelThresholdService from '../service/FullSyncDelThresholdService'
import fullSyncRecordService from '../service/FullSyncRecordService'
import testDataService from "../../modules/service/TestDataService";
import { fullSyncStatisticAnalyseSrv } from "../service/FullSyncStatisticAnalyseSrv";
import {Database, decryptKey, log} from '../../sdk/cognac'

class DbManager {
  collectDb: Database
  selfDb: Database

  async init() {
    await this.initCollectDb()
    await this.initSelfDb()
    companyCfgService.init(this.collectDb)
    // 初始化锁
    lockService.init(this.selfDb)
    lasIncrementService.init(this.collectDb, this.selfDb)

    lasAdminService.init(this.collectDb, this.selfDb)

    fullSyncTaskService.init(this.selfDb)

    syncJobSettingService.init(this.selfDb)

    fullSyncScopeService.init(this.selfDb)

    fullSyncDelThresholdService.init(this.selfDb)

    fullSyncRecordService.init(this.selfDb)

    fullSyncStatisticAnalyseSrv.init(this.collectDb, this.selfDb)

    //...
    testDataService.init(this.collectDb, this.selfDb)



    //...

    await lockService.releaseAllLock(config.regionId)
    await fullSyncTaskService.failAllSyncingTask(config.regionId)
    await fullSyncStatisticAnalyseSrv.clearAllInterruptAnalyse()
  }

  async initCollectDb() {
    const ecisDSN = `ECIS_${config.componentId}_${config.db1.name}`.toLocaleUpperCase()
    let dsn = ''
    if (process.env.IS_MANUAL_DB) {
      dsn = `mysql://${process.env.MANUAL_DB1}`
    } else {
      dsn = `mysql://${decryptKey(process.env[ecisDSN], config.appKey)}`
    }
    let dbc = this.parseDbDSN(dsn)
    if (!dbc) {
      dbc = {
        host : config.db1.host,
        port : config.db1.port,
        user : config.db1.user,
        password : Buffer.from(config.db1.password, 'base64').toString(),
        database : config.db1.database
      }
    }
    log.i({info: `init db collect. host: ${dbc.host}, database: ${dbc.database}, user: ${dbc.user}`})
    this.collectDb = new Database()
    await this.collectDb.init({
      host: dbc.host,
      port: parseInt(dbc.port),
      user: dbc.user,
      password: dbc.password,
      database: dbc.database,
      multipleStatements: false
    }, config.sqlRetryNum)
    log.i({info: `init db collect success.`})
  }

  async initSelfDb() {
    const ecisDSN = `ECIS_${config.componentId}_${config.db2.name}`.toLocaleUpperCase()
    let dsn = ''
    if (process.env.IS_MANUAL_DB) {
      dsn = `mysql://${process.env.MANUAL_DB2}`
    } else {
      dsn = `mysql://${decryptKey(process.env[ecisDSN], config.appKey)}`
    }
    let dbc = this.parseDbDSN(dsn)
    if (!dbc) {
      dbc = {
        host : config.db2.host,
        port : config.db2.port,
        user : config.db2.user,
        password : Buffer.from(config.db2.password, 'base64').toString(),
        database : config.db2.database
      }
    }
    log.i({info: `init db self. host: ${dbc.host}, database: ${dbc.database}, user: ${dbc.user}`})
    this.selfDb = new Database()
    await this.selfDb.init({
      host: dbc.host,
      port: parseInt(dbc.port),
      user: dbc.user,
      password: dbc.password,
      database: dbc.database,
      multipleStatements: false
    }, config.sqlRetryNum)
    log.i({info: `init db self success.`})
  }

  parseDbDSN(dsn: string) {
    const regex = /mysql:\/\/(\w+):(.+)@tcp\(([^:]+):(\d+)\)\/([^?]+)(.*=.*)?/;
    // const regex = /mysql:\/\/(\w+):(.+)@tcp\(([^:]+):(\d+)\)\/(.+)\?.*=(.*)/;
    // const regex = /mysql:\/\/(?:([a-zA-Z0-9_]+)(?::([^@]+))?@)?\w+\(([^:]+):(\d+)\)\/(.+)\?.*=(.*)/;
    const match = dsn.match(regex);
    if (!match) {
      return null;
    }
    const [, user, password, host, port, database] = match;
    return {
      user,
      password,
      host,
      port,
      database
    };
  }
}

export default new DbManager()
