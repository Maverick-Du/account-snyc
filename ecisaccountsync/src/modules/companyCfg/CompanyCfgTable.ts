/* eslint-disable camelcase */
import {IDatabase, Table } from "../../sdk/cognac/orm"

export enum CfgStatus {
  ENABLE = 1,
  DISABLE = 0
}

export interface CompanyCfgSchema {
  id: number
  third_company_id: string
  platform_ids: string
  company_id: string
  status: CfgStatus
  ctime: number
  mtime: number
}

export class CompanyCfgTable extends Table<CompanyCfgSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_company_cfg')
  }

  async getCompanyCfgs(status: CfgStatus) {
    return this.select('*').where('`status` = ?', status).query()
  }

  async getCompanyCfg(companyId: string) {
    let arr = await this.select('*').where('company_id =? and `status` = ?', companyId, CfgStatus.ENABLE).query()
    if (arr && arr.length > 0) {
      return arr[0]
    }
    return null
  }

  async getCfgByThirdCompanyId(thirdCompanyId: string) {
    let arr = await this.select('*').where('third_company_id =? and `status` = ?', thirdCompanyId, CfgStatus.ENABLE).query()
    if (arr && arr.length > 0) {
      return arr[0]
    }
    return null
  }

  async addCfg(ovs: Partial<CompanyCfgSchema>): Promise<number> {
    return this.add(ovs).query()
  }
}
