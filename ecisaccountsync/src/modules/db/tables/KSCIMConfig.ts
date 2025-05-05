import { IDatabase, Table } from "../../../sdk/cognac/orm"

export interface KSCIMConfigSchema {
    id?: number
    company_id: string
    dep_url: string
    user_url: string
    token_name: string
    token_value: string
    root_dep_id_name: string
    root_dep_id_value: string
    root_dep_name: string
    sync_time: number
    ctime?: Date
    utime?: Date
}

export class KSCIMConfigTable extends Table<KSCIMConfigSchema> {
    constructor(db: IDatabase) {
        super(db, 'kscim_config')
    }

    async addConfig(config: KSCIMConfigSchema): Promise<number> {
        return this.add(config).query()
    }

    async getConfig(companyId: string): Promise<KSCIMConfigSchema> {
        const configs = await this.select('*').where('company_id = ?', companyId).query()
        return configs.length > 0 ? configs[0] : null
    }

    async updateConfig(companyId: string, config: Partial<KSCIMConfigSchema>): Promise<number> {
        const result = await this.update(config).where('company_id = ?', companyId).query()
        return Number(result)
    }
} 