/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"
import {ScheduleJobType} from "../../schedule/ScheduleService";

export interface SyncJobSettingSchema {
  id: number
  company_id: string
  sync_type: ScheduleJobType
  sync_time: string
  end_time: string
  open: number
  rate: number
  type: string  // min-按分钟 hour-按小时
  cron: string
  ctime: number
  mtime: number
}

export class SyncJobSettingTable extends Table<SyncJobSettingSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_sync_job_setting')
  }

  async getAllConfigs() {
    return this.select('*').query()
  }

  async getSyncConfigs(type: ScheduleJobType) {
    return this.select('*').where('sync_type =?', type).query()
  }

  async getSyncConfig(companyId: string, type: ScheduleJobType): Promise<SyncJobSettingSchema> {
    let arr = await this.select('*').where('company_id = ? and sync_type =?', companyId, type).query()
    if (arr && arr.length > 0) {
      return arr[0]
    }
    return null
  }

  async updateSyncConfig(ovs: Partial<SyncJobSettingSchema>): Promise<number> {
    let res: any = await this.update(ovs).where('company_id = ? and sync_type =?', ovs.company_id, ovs.sync_type).query()
    return res.affectedRows
  }

  async updateSyncTime(companyId: string, type: ScheduleJobType, syncTime: string) {
    let res: any = await this.update({
      sync_time: syncTime
    }).where('company_id = ? and sync_type =?', companyId, type).query()
    return res.affectedRows
  }

  async updateEndTime(companyId: string, type: ScheduleJobType, endTime: string) {
    let res: any = await this.update({
      end_time: endTime
    }).where('company_id = ? and sync_type =?', companyId, type).query()
    return res.affectedRows
  }

  async addSyncConfig(ovs: Partial<SyncJobSettingSchema>) {
    return this.add(ovs).query()
  }

}
