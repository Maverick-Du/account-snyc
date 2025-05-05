import { IDatabase } from "../../sdk/cognac/orm"
import { KSCIMConfigSchema, KSCIMConfigTable } from "../db/tables/KSCIMConfig"
import { KSCIMFieldMappingSchema, KSCIMFieldMappingTable } from "../db/tables/KSCIMFieldMapping"
import { Result } from "../../common/type"
import axios from 'axios'
import { log } from '../../sdk/cognac'

export interface KSCIMConfig {
    DepUrl: string
    UserUrl: string
    TokenName: string
    TokenValue: string
    RootDepLdName: string
    RootDopLdValue: string
    RootDepName: string
}

export interface KSCIMFieldMapping {
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
}

export class KSCIMService {
    private db: IDatabase
    private configTable: KSCIMConfigTable
    private fieldMappingTable: KSCIMFieldMappingTable

    init(db: IDatabase) {
        this.db = db
        this.configTable = new KSCIMConfigTable(this.db)
        this.fieldMappingTable = new KSCIMFieldMappingTable(this.db)
    }

    async saveConfig(thirdCompanyId: number, config: KSCIMConfig): Promise<Result> {
        try {
            const existingConfig = await this.configTable.getConfig(thirdCompanyId)
            const configSchema: KSCIMConfigSchema = {
                third_company_id: thirdCompanyId,
                dep_url: config.DepUrl,
                user_url: config.UserUrl,
                token_name: config.TokenName,
                token_value: config.TokenValue,
                root_dep_id_name: config.RootDepLdName,
                root_dep_id_value: config.RootDopLdValue,
                root_dep_name: config.RootDepName,
                sync_time: 0
            }

            if (existingConfig) {
                await this.configTable.updateConfig(thirdCompanyId, configSchema)
            } else {
                await this.configTable.addConfig(configSchema)
            }

            return new Result(Result.SUCCESS_CODE, "保存成功")
        } catch (err) {
            log.error("保存KSCIM配置失败", err)
            return new Result(Result.FAIL_CODE, "保存失败")
        }
    }

    async getConfig(thirdCompanyId: number): Promise<Result> {
        try {
            const config = await this.configTable.getConfig(thirdCompanyId)
            if (!config) {
                return new Result(Result.FAIL_CODE, "未找到配置")
            }

            const result: KSCIMConfig = {
                DepUrl: config.dep_url,
                UserUrl: config.user_url,
                TokenName: config.token_name,
                TokenValue: config.token_value,
                RootDepLdName: config.root_dep_id_name,
                RootDopLdValue: config.root_dep_id_value,
                RootDepName: config.root_dep_name
            }

            return new Result(Result.SUCCESS_CODE, "获取成功", result)
        } catch (err) {
            log.error("获取KSCIM配置失败", err)
            return new Result(Result.FAIL_CODE, "获取失败")
        }
    }

    async testConnection(thirdCompanyId: number): Promise<Result> {
        try {
            const config = await this.configTable.getConfig(thirdCompanyId)
            if (!config) {
                return new Result(Result.FAIL_CODE, "未找到配置")
            }

            // 测试部门接口
            const depResponse = await axios.get(config.dep_url, {
                params: {
                    dept_id: config.root_dep_id_value,
                    token: config.token_value,
                    page_size: 1000
                }
            })

            if (depResponse.status !== 200) {
                return new Result(Result.FAIL_CODE, "部门接口测试失败")
            }

            // 测试用户接口
            const userResponse = await axios.get(config.user_url, {
                params: {
                    dept_id: config.root_dep_id_value,
                    token: config.token_value,
                    page_size: 1000
                }
            })

            if (userResponse.status !== 200) {
                return new Result(Result.FAIL_CODE, "用户接口测试失败")
            }

            return new Result(Result.SUCCESS_CODE, "测试成功")
        } catch (err) {
            log.error("KSCIM连接测试失败", err)
            return new Result(Result.FAIL_CODE, "测试失败")
        }
    }

    async saveFieldMapping(thirdCompanyId: number, mapping: KSCIMFieldMapping): Promise<Result> {
        try {
            const existingMapping = await this.fieldMappingTable.getMapping(thirdCompanyId)
            const mappingSchema: KSCIMFieldMappingSchema = {
                third_company_id: thirdCompanyId,
                ...mapping
            }

            if (existingMapping) {
                await this.fieldMappingTable.updateMapping(thirdCompanyId, mappingSchema)
            } else {
                await this.fieldMappingTable.addMapping(mappingSchema)
            }

            return new Result(Result.SUCCESS_CODE, "保存成功")
        } catch (err) {
            log.error("保存字段映射失败", err)
            return new Result(Result.FAIL_CODE, "保存失败")
        }
    }

    async getFieldMapping(thirdCompanyId: number): Promise<Result> {
        try {
            const mapping = await this.fieldMappingTable.getMapping(thirdCompanyId)
            if (!mapping) {
                return new Result(Result.FAIL_CODE, "未找到映射配置")
            }

            const result: KSCIMFieldMapping = {
                uid: mapping.uid,
                def_did: mapping.def_did,
                def_did_order: mapping.def_did_order,
                account: mapping.account,
                nick_name: mapping.nick_name,
                password: mapping.password,
                avatar: mapping.avatar,
                email: mapping.email,
                gender: mapping.gender,
                title: mapping.title,
                work_place: mapping.work_place,
                leader: mapping.leader,
                employer: mapping.employer,
                employment_status: mapping.employment_status,
                employment_type: mapping.employment_type,
                phone: mapping.phone,
                telephone: mapping.telephone,
                did: mapping.did,
                pid: mapping.pid,
                name: mapping.name,
                order: mapping.order
            }

            return new Result(Result.SUCCESS_CODE, "获取成功", result)
        } catch (err) {
            log.error("获取字段映射失败", err)
            return new Result(Result.FAIL_CODE, "获取失败")
        }
    }

    async syncData(thirdCompanyId: number): Promise<Result> {
        try {
            const config = await this.configTable.getConfig(thirdCompanyId)
            if (!config) {
                return new Result(Result.FAIL_CODE, "未找到配置")
            }

            const mapping = await this.fieldMappingTable.getMapping(thirdCompanyId)
            if (!mapping) {
                return new Result(Result.FAIL_CODE, "未找到字段映射配置")
            }

            // TODO: 实现数据同步逻辑
            // 1. 获取部门数据
            // 2. 获取用户数据
            // 3. 同步到四个目标表

            return new Result(Result.SUCCESS_CODE, "同步成功")
        } catch (err) {
            log.error("KSCIM数据同步失败", err)
            return new Result(Result.FAIL_CODE, "同步失败")
        }
    }
}

export default new KSCIMService() 