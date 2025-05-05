import las from '../service/LasIncrementService'
import { SyncContext } from './context'
import config from "../../common/config";
import {addDays, format} from 'date-fns';
import fullSyncTaskService from "../service/FullSyncTaskService";
import fullSyncRecordService from "../service/FullSyncRecordService";
import fullSyncScopeService from "../service/FullSyncScopeService";
import {formatTimeToSQL} from "../../common/util";
import { log } from '../../sdk/cognac';

export default async function syncClear(ctx: SyncContext) {
  const now = new Date()
  const currDate = format(now, 'yyyy-MM-dd HH:mm:ss')
  log.i({ info: `scheduleClearData start... cron: ${config.schedule.clearCron}, date: ${currDate}` })
  // 默认保留最近10次的采集数据
  await clearFullLasData(ctx)
  await clearIncrementSyncLasData()
  await clearFullSyncScopeData()
}

async function clearFullLasData(ctx: SyncContext) {
  try {
    let flag = await checkFullNeedClear(ctx)
    while (flag) {
      const taskIds = await ctx.engine.las.getDistinctTaskId()
      let syncingTask = await fullSyncTaskService.querySyncingTask()
      if (syncingTask && syncingTask.task_id == taskIds[0]) {
        break
      }
      await ctx.engine.las.deleteDeptsAndUsersByTaskId(taskIds[0])
      log.i({ info: `scheduleClearData clear full las data. taskId: ${taskIds[0]}` })
      await clearFullSyncRecordData(taskIds[0])
      flag = await checkFullNeedClear(ctx)
    }
  } catch (e) {
    e.msg = `scheduleClearData clear full las data throw error, message: ${e.message}`
    log.e(e)
  }
}

async function checkFullNeedClear(ctx: SyncContext) {
  let countData = await ctx.engine.las.countLasData()
  log.i({ info: `scheduleClearData full las data: ${JSON.stringify(countData)}` })
  return countData.userCount > config.saveDataSize || countData.deptCount > config.saveDataSize || countData.deptUserCount > config.saveDataSize;
}

async function clearIncrementSyncLasData() {
  try {
    let flag = await checkIncrementNeedClear()
    while (flag) {
      let timeData = await las.getOlderTime()
      let arr = []
      if (timeData.deptOlderTime) {
        arr.push(timeData.deptOlderTime.getTime())
      }
      if (timeData.userOlderTime) {
        arr.push(timeData.userOlderTime.getTime())
      }
      if (timeData.deptUserOlderTime) {
        arr.push(timeData.deptUserOlderTime.getTime())
      }
      if (arr.length > 0) {
        let minTime = Math.min(...arr)
        let time = new Date(minTime)
        time = addDays(time, 1)
        time.setHours(0,0,0,0)
        let timeStr = formatTimeToSQL(time.getTime())
        await las.deleteDataByTime(timeStr)
        log.i({ info: `scheduleClearData clear increment las data. time: ${timeStr}` })
      }
      flag = await checkIncrementNeedClear()
    }
  } catch (e) {
    e.msg = `scheduleClearData clear increment las data throw error, message: ${e.message}`
    log.e(e)
  }
}

async function checkIncrementNeedClear() {
  let countData = await las.countLasData()
  log.i({ info: `scheduleClearData increment las data: ${JSON.stringify(countData)}` })
  return countData.userCount > config.saveDataSize || countData.deptCount > config.saveDataSize || countData.deptUserCount > config.saveDataSize;
}

async function checkFullSyncRecordNeedClear() {
  let countData = await fullSyncRecordService.countRecordData()
  log.i({ info: `scheduleClearData full sync record data: ${JSON.stringify(countData)}` })
  return countData.userCount > config.saveDataSize || countData.deptCount > config.saveDataSize || countData.deptUserCount > config.saveDataSize;
}

async function clearFullSyncRecordData(taskId: string) {
  try {
    await fullSyncRecordService.deleteRecordDataByTaskId(taskId)
    log.i({ info: `scheduleClearData clear full record data success. taskId: ${taskId}` })
  } catch (e) {
    e.msg = `scheduleClearData clear full record data throw error, message: ${e.message}`
    log.e(e)
  }
}

async function clearFullSyncScopeData() {
    try {
      let time = new Date()
      time = addDays(time, -config.saveDataDay)
      time.setHours(0,0,0,0)
      let timeStr = formatTimeToSQL(time.getTime())
      await fullSyncScopeService.deleteDisableScopeConfig(timeStr)
      log.i({ info: `scheduleClearData clear full sync scope data success. time: ${timeStr}` })
    } catch (e) {
      e.msg = `scheduleClearData clear full sync scope data throw error, message: ${e.message}`
      log.e(e)
    }
}
