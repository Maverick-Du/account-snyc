import {FullSyncDelThresholdTable} from "../db/tables/FullSyncDelThreshold";
import {IDatabase} from "../../sdk/cognac/orm";

export class FullSyncDelThresholdService {
    private db: IDatabase

    private delThresholdTable: FullSyncDelThresholdTable

    init(db: IDatabase) {
        this.db = db
        this.delThresholdTable = new FullSyncDelThresholdTable(this.db)
    }

    async addConfig(company_id: string, user_del: number, dept_del: number, dept_user_del: number) {
        await this.delThresholdTable.addConfig({
            company_id: company_id,
            user_del: user_del,
            dept_del: dept_del,
            dept_user_del: dept_user_del,
            operator: "系统"
        })
    }

    async getConfig(company_id: string) {
        return this.delThresholdTable.getConfig(company_id)
    }

    async updateConfig(company_id: string, user_del: number, dept_del: number, dept_user_del: number, operator: string) {
        await this.delThresholdTable.updateConfig(company_id, user_del, dept_del, dept_user_del, operator)
    }

}

export default new FullSyncDelThresholdService()
