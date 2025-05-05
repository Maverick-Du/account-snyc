import { KSCIMConfigSchema } from "../db/tables/KSCIMConfig"
import { KSCIMFieldMappingSchema } from "../db/tables/KSCIMFieldMapping"
import axios from 'axios'
import { log } from '../../sdk/cognac'

interface Department {
    dept_id: string
    dept_name: string
    parent_id?: string
}

interface User {
    guid: string
    dept_ids: string[]
    [key: string]: any
}

export class KSCIMSync {
    private config: KSCIMConfigSchema
    private mapping: KSCIMFieldMappingSchema

    constructor(config: KSCIMConfigSchema, mapping: KSCIMFieldMappingSchema) {
        this.config = config
        this.mapping = mapping
    }

    async sync(): Promise<void> {
        try {
            // 1. 获取所有部门
            const departments = await this.getAllDepartments()
            
            // 2. 获取所有用户
            const users = await this.getAllUsers()
            
            // 3. 同步到目标表
            await this.syncToTargetTables(departments, users)
        } catch (err) {
            log.error("KSCIM同步失败", err)
            throw err
        }
    }

    private async getAllDepartments(): Promise<Department[]> {
        const departments: Department[] = []
        let nextPageToken = ""
        
        do {
            const response = await axios.get(this.config.dep_url, {
                params: {
                    dept_id: this.config.root_dep_id_value,
                    token: this.config.token_value,
                    page_token: nextPageToken,
                    page_size: 1000
                }
            })

            if (response.status !== 200) {
                throw new Error("获取部门数据失败")
            }

            const data = response.data
            departments.push(...data.resources)
            nextPageToken = data.next_page_token
        } while (nextPageToken)

        return departments
    }

    private async getAllUsers(): Promise<User[]> {
        const users: User[] = []
        let nextPageToken = ""
        
        do {
            const response = await axios.get(this.config.user_url, {
                params: {
                    dept_id: this.config.root_dep_id_value,
                    token: this.config.token_value,
                    page_token: nextPageToken,
                    page_size: 1000
                }
            })

            if (response.status !== 200) {
                throw new Error("获取用户数据失败")
            }

            const data = response.data
            users.push(...data.resources)
            nextPageToken = data.next_page_token
        } while (nextPageToken)

        return users
    }

    private async syncToTargetTables(departments: Department[], users: User[]): Promise<void> {
        // TODO: 实现同步到四个目标表的逻辑
        // 1. 同步到 tb_company_cfg
        // 2. 同步到 tb_las_user
        // 3. 同步到 tb_las_department
        // 4. 同步到 tb_las_department_user

        // 这里需要根据字段映射配置，将源数据映射到目标表字段
        // 使用 this.mapping 中的映射关系进行字段转换
    }

    private mapFields(source: any, mapping: KSCIMFieldMappingSchema): any {
        const target: any = {}
        
        // 根据映射配置转换字段
        for (const [key, value] of Object.entries(mapping)) {
            if (value && source[value]) {
                target[key] = source[value]
            }
        }

        return target
    }
} 