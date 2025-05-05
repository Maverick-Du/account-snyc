import { IDatabase, Table } from "../../../sdk/cognac/orm"

export interface KSCIMFieldMappingSchema {
    id?: number
    company_id: string
    uid?: string
    def_did?: string
    def_did_order?: number
    account?: string
    nick_name?: string
    password?: string
    avatar?: string
    email?: string
    gender?: string
    title?: string
    work_place?: string
    leader?: string
    employer?: string
    employment_status?: string
    employment_type?: string
    phone?: string
    telephone?: string
    did?: string
    pid?: string
    name?: string
    order?: number
    ctime?: Date
    utime?: Date
}

export class KSCIMFieldMappingTable extends Table<KSCIMFieldMappingSchema> {
    constructor(db: IDatabase) {
        super(db, 'tb_kscim_field_mapping')
    }

    async addMapping(mapping: KSCIMFieldMappingSchema): Promise<number> {
        return this.add(mapping).query()
    }

    async getMapping(companyId: string): Promise<KSCIMFieldMappingSchema> {
        const mappings = await this.select('*').where('company_id = ?', companyId).query()
        return mappings.length > 0 ? mappings[0] : null
    }

    async updateMapping(companyId: string, mapping: Partial<KSCIMFieldMappingSchema>): Promise<number> {
        const result = await this.update(mapping).where('company_id = ?', companyId).query()
        return Number(result)
    }
} 