import {CfgStatus, CompanyCfgTable} from './CompanyCfgTable'
import {CompanyCfg} from "../../sdk/account";
import {IDatabase} from "../../sdk/cognac/orm";

class CompanyCfgService {
  private db: IDatabase
  private cfgTable: CompanyCfgTable

  init(db: IDatabase) {
    this.db = db
    this.cfgTable = new CompanyCfgTable(db)
  }

  async loadCfgs(): Promise<CompanyCfg[]>{
    let data: CompanyCfg[] = []
    let cfgs = await this.cfgTable.getCompanyCfgs(CfgStatus.ENABLE)
    for (const cfg of cfgs) {
      data.push({
        thirdCompanyId: cfg.third_company_id,
        platformIdList: cfg.platform_ids.split(","),
        companyId: cfg.company_id
      })
    }
    return data
  }

  async loadCfgsMap(): Promise<Map<string, CompanyCfg>>{
    let cfgs = await this.loadCfgs()
    let map = new Map<string, CompanyCfg>()
    for (const cfg of cfgs) {
      map.set(cfg.thirdCompanyId, cfg)
    }
    return map
  }

  async getCfgByCompanyId(companyId: string): Promise<CompanyCfg>{
    let schema = await this.cfgTable.getCompanyCfg(companyId)
    if (schema) {
      return {
        thirdCompanyId: schema.third_company_id,
        platformIdList: schema.platform_ids.split(","),
        companyId: schema.company_id
      }
    }
    return null
  }

  async getCfgByThirdCompanyId(thirdCompanyId: string): Promise<CompanyCfg>{
    let schema = await this.cfgTable.getCfgByThirdCompanyId(thirdCompanyId)
    if (schema) {
      return {
        thirdCompanyId: schema.third_company_id,
        platformIdList: schema.platform_ids.split(","),
        companyId: schema.company_id
      }
    }
    return null
  }
}

export default new CompanyCfgService()
