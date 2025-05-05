import {IDatabase} from "../../sdk/cognac/orm";
import {CompanyCfgTable} from "../companyCfg/CompanyCfgTable";
import {
    LASDepartmentTable,
    LASDepartmentUserTable,
    LASUserTable, WPSDepartment, WPSUser,
    WPSUserStatus
} from "../../sdk/account";
import {LasDepartmentIncrementTable} from "../db/tables/LasDepartmentIncrement";
import {LasUserIncrementTable} from "../db/tables/LasUserIncrement";
import {LasDepartmentUserIncrementTable} from "../db/tables/LasDepartmentUserIncrement";
import * as xlsx from 'xlsx'
import {format} from "date-fns";
import * as fs from "fs";
import {FullSyncTaskTable} from "../db/tables/FullSyncTask";
import {FullSyncTaskStatisticsTable} from "../db/tables/FullSyncTaskStatistics";
import {FullSyncUserRecordTable} from "../db/tables/FullSyncUserRecord";
import {FullSyncDeptRecordTable} from "../db/tables/FullSyncDeptRecord";
import {FullSyncDeptUserRecordTable} from "../db/tables/FullSyncDeptUserRecord";
import {FullSyncStatus, FullSyncUpdateType, RecordStatus} from "../db/types";
import sync from '../../modules/sync'
import config from "../../common/config";

export class TestDataService {
    private db: IDatabase
    private companyCfgTable: CompanyCfgTable
    private lasDepartmentTable: LASDepartmentTable
    private lasUserTable: LASUserTable
    private lasDepartmentUserTable: LASDepartmentUserTable
    private lasDepartmentIncrementTable: LasDepartmentIncrementTable
    private lasUserIncrementTable: LasUserIncrementTable
    private lasDepartmentUserIncrementTable: LasDepartmentUserIncrementTable
    private fullSyncTaskTable: FullSyncTaskTable
    private fullSyncTaskStatisticsTable: FullSyncTaskStatisticsTable
    private fullSyncUserRecordTable: FullSyncUserRecordTable
    private fullSyncDeptRecordTable: FullSyncDeptRecordTable
    private fullSyncDeptUserRecordTable: FullSyncDeptUserRecordTable

    init(db: IDatabase, selfDb: IDatabase) {
        this.db = db
        this.companyCfgTable = new CompanyCfgTable(db)
        this.lasDepartmentTable = new LASDepartmentTable(db)
        this.lasUserTable = new LASUserTable(db)
        this.lasDepartmentUserTable = new LASDepartmentUserTable(db)
        this.lasDepartmentIncrementTable = new LasDepartmentIncrementTable(db)
        this.lasUserIncrementTable = new LasUserIncrementTable(db)
        this.lasDepartmentUserIncrementTable = new LasDepartmentUserIncrementTable(db)

        this.fullSyncTaskTable = new FullSyncTaskTable(selfDb)
        this.fullSyncTaskStatisticsTable = new FullSyncTaskStatisticsTable(selfDb)
        this.fullSyncUserRecordTable = new FullSyncUserRecordTable(selfDb)
        this.fullSyncDeptRecordTable = new FullSyncDeptRecordTable(selfDb)
        this.fullSyncDeptUserRecordTable = new FullSyncDeptUserRecordTable(selfDb)
    }

    async testData(file: any, companyId: string): Promise<any> {
        let taskId: string = format(new Date(), 'yyyyMMddHHmmss')
        const reader = fs.readFileSync(file.filepath); // 读取上传的文件
        const workbook = xlsx.read(reader, {type: 'buffer'}); // 使用xlsx读取文件
        const sheetNames = workbook.SheetNames;

        let thirdCompanyId: string = `third_${companyId}`
        let platformIds: string = `platform_${companyId}`

        let cfg = await this.companyCfgTable.getCompanyCfg(companyId)
        if (!cfg) {
            await this.companyCfgTable.addCfg({
                third_company_id: thirdCompanyId,
                platform_ids: platformIds,
                company_id: companyId,
                status: 1
            })
        }

        for (const sheetName of sheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const rows: any[] = xlsx.utils.sheet_to_json(worksheet)
            switch (sheetName) {
                case "tb_las_department":
                    for (const row of rows) {
                        row.task_id = taskId
                        row.third_company_id = thirdCompanyId
                        row.platform_id = platformIds
                        await this.lasDepartmentTable.addDept(row)
                    }
                    break
                case "tb_las_user":
                    for (const row of rows) {
                        row.task_id = taskId
                        row.third_company_id = thirdCompanyId
                        row.platform_id = platformIds
                        await this.lasUserTable.addUser(row)
                    }
                    break
                case "tb_las_department_user":
                    for (const row of rows) {
                        row.task_id = taskId
                        row.third_company_id = thirdCompanyId
                        row.platform_id = platformIds
                        await this.lasDepartmentUserTable.addDeptUser(row)
                    }
                    break
                case "tb_las_department_increment":
                    for (const row of rows) {
                        row.third_company_id = thirdCompanyId
                        row.platform_id = platformIds
                        await this.lasDepartmentIncrementTable.addDeptIncrement(row)
                    }
                    break
                case "tb_las_user_increment":
                    for (const row of rows) {
                        row.third_company_id = thirdCompanyId
                        row.platform_id = platformIds
                        await this.lasUserIncrementTable.addUser(row)
                    }
                    break
                case "tb_las_department_user_increment":
                    for (const row of rows) {
                        row.third_company_id = thirdCompanyId
                        row.platform_id = platformIds
                        await this.lasDepartmentUserIncrementTable.addDeptUserIncrement(row)
                    }
                    break
                default:
                    break
            }
        }
        return {
            taskId: taskId,
            companyId: companyId,
            thirdCompanyId: thirdCompanyId
        }
    }

    async checkSync(companyId: string, taskId: string) {
        let task = await this.fullSyncTaskTable.getTask(taskId, companyId)
        if (!task) {
            throw new Error(`未找到对应的task, taskId: ${taskId}`)
        }
        if (task.status != FullSyncStatus.SYNC_SUCCESS) {
            return {
                task: {
                    companyId: companyId,
                    taskId: taskId,
                    status: task.status,
                    msg: task.error_msg
                },
                check: null as any
            }
        } else {
            let userErrors = []
            let deptErrors = []
            let deptUserErrors = []
            let userRecords = await this.fullSyncUserRecordTable.queryRecordsByStatus(companyId, taskId, [RecordStatus.SUCCESS])
            let deptRecords = await this.fullSyncDeptRecordTable.queryRecordsByStatus(companyId, taskId, [RecordStatus.SUCCESS])
            let deptUserRecords = await this.fullSyncDeptUserRecordTable.queryRecordsByStatus(companyId, taskId, [RecordStatus.SUCCESS])

            let wpsUsers: WPSUser[] = []
            await this.groupOpt(userRecords, async (items)=>{
                let wus = await sync.ctx.engine.was.getUsersByLocal(companyId, items[0].platform_id, items.map(x=>x.uid))
                wpsUsers.push(...wus)
            })
            const wpsUserMap = new Map<string, WPSUser>()
            wpsUsers.forEach(x => wpsUserMap.set(x.third_union_id, x))
            for (const userRecord of userRecords) {
                let wpsUser = wpsUserMap.get(userRecord.uid)
                switch (userRecord.update_type) {
                    case FullSyncUpdateType.UserAdd:
                        if (!wpsUser) {
                            userErrors.push({id: userRecord.uid, name: userRecord.name, type: "user", msg: "用户新增失败"})
                        }
                        break
                    case FullSyncUpdateType.UserDel:
                        if (wpsUser && wpsUser.status != WPSUserStatus.Disabled) {
                            userErrors.push({id: userRecord.uid, name: userRecord.name, type: "user", msg: "用户删除失败"})
                        }
                        break
                    case FullSyncUpdateType.UserUpdate:
                        if (!wpsUser) {
                            userErrors.push({id: userRecord.uid, name: userRecord.name, type: "user", msg: "用户修改失败"})
                        }
                        break
                    case FullSyncUpdateType.UserDisable:
                        if (!wpsUser || wpsUser.status != WPSUserStatus.Disabled) {
                            userErrors.push({id: userRecord.uid, name: userRecord.name, type: "user", msg: "用户禁用失败"})
                        }
                        break
                    case FullSyncUpdateType.UserEnable:
                        if (!wpsUser || wpsUser.status != WPSUserStatus.Active) {
                            userErrors.push({id: userRecord.uid, name: userRecord.name, type: "user", msg: "用户启用失败"})
                        }
                        break
                    default:
                        userErrors.push({id: userRecord.uid, name: userRecord.name, type: "user", msg: `未知的update_type: ${userRecord.update_type}`})
                }
            }

            let wpsDepts: WPSDepartment[] = []
            await this.groupOpt(deptRecords, async (items)=>{
                let wus = await sync.ctx.engine.was.queryDeptsByThirdUnionIds(companyId, items[0].platform_id, items.map(x=>x.did))
                wpsDepts.push(...wus)
            })
            const wpsDeptMap = new Map<string, WPSDepartment>()
            wpsDepts.forEach(x => wpsDeptMap.set(x.third_dept_id, x))
            for (const deptRecord of deptRecords) {
                let wpsDept = wpsDeptMap.get(deptRecord.did)
                switch (deptRecord.update_type) {
                    case FullSyncUpdateType.DeptAdd:
                        if (!wpsDept) {
                            deptErrors.push({id: deptRecord.did, name: deptRecord.name, type: "dept", msg: "部门创建失败"})
                        }
                        break
                    case FullSyncUpdateType.DeptDel:
                        if (wpsDept) {
                            deptErrors.push({id: deptRecord.did, name: deptRecord.name, type: "dept", msg: "部门删除失败"})
                        }
                        break
                    case FullSyncUpdateType.DeptUpdate:
                        if (!wpsDept) {
                            deptErrors.push({id: deptRecord.did, name: deptRecord.name, type: "dept", msg: "部门修改失败"})
                        }
                        break
                    case FullSyncUpdateType.DeptMove:
                        if (!wpsDept || wpsDept.dept_pid != deptRecord.wps_pid) {
                            deptErrors.push({id: deptRecord.did, name: deptRecord.name, type: "dept", msg: "部门移动失败"})
                        }
                        break
                    default:
                        deptErrors.push({id: deptRecord.did, name: deptRecord.name, type: "dept", msg: `未知的update_type: ${deptRecord.update_type}`})
                }
            }
            for (const deptUserRecord of deptUserRecords) {
                let wpsUser = await sync.ctx.engine.was.getUserByLocal(companyId, deptUserRecord.platform_id, deptUserRecord.uid)
                if (!wpsUser) {
                    if (deptUserRecord.update_type != FullSyncUpdateType.UserDeptDel) {
                        deptUserErrors.push({id: `${deptUserRecord.uid}`, name: deptUserRecord.name, type: "dept_user", msg: `未找到对应用户`})
                    }
                    continue
                }
                let wpsDepts = await sync.ctx.engine.was.listDepartmentsByUser(companyId, wpsUser)
                let flag = false
                switch (deptUserRecord.update_type) {
                    case FullSyncUpdateType.UserDeptAdd:
                        flag = false
                        wpsDepts.forEach(x => {
                            if (x.dept_id == deptUserRecord.wps_did) {
                                flag = true
                            }
                        })
                        if (!flag) {
                            deptUserErrors.push({id: `${deptUserRecord.uid}`, name: deptUserRecord.name, type: "dept_user", msg: `用户加入部门失败`})
                        }
                        break
                    case FullSyncUpdateType.UserDeptDel:
                        flag = false
                        wpsDepts.forEach(x => {
                            if (x.dept_id == deptUserRecord.wps_did) {
                                flag = true
                            }
                        })
                        if (flag) {
                            deptUserErrors.push({id: `${deptUserRecord.uid}`, name: deptUserRecord.name, type: "dept_user", msg: `用户退出部门失败`})
                        }
                        break
                    case FullSyncUpdateType.UserOrderUpdate:
                        flag = false
                        wpsDepts.forEach(x => {
                            if (x.dept_id == deptUserRecord.wps_did) {
                                flag = true
                            }
                        })
                        if (!flag) {
                            deptUserErrors.push({id: `${deptUserRecord.uid}`, name: deptUserRecord.name, type: "dept_user", msg: `用户修改部门排序值失败`})
                        }
                        break
                    case FullSyncUpdateType.MainDeptUpdate:
                        flag = false
                        wpsDepts.forEach(x => {
                            if (x.dept_id == deptUserRecord.wps_did) {
                                flag = wpsUser.def_dept_id == deptUserRecord.wps_did
                            }
                        })
                        if (!flag) {
                            deptUserErrors.push({id: `${deptUserRecord.uid}`, name: deptUserRecord.name, type: "dept_user", msg: `用户修改主部门失败`})
                        }
                        break
                    default:
                        deptErrors.push({id: `${deptUserRecord.uid}`, name: deptUserRecord.name, type: "dept_user", msg: `未知的update_type: ${deptUserRecord.update_type}`})
                }
            }
            return {
                task: {
                    companyId: companyId,
                    taskId: taskId,
                    status: task.status,
                    msg: task.error_msg
                },
                check: {userErrors: userErrors, deptErrors: deptErrors, deptUserErrors: deptUserErrors}
            }
        }
    }

    // 分批操作
    async groupOpt<T>(
        data: T[],
        func: { (objectGroup: T[]): Promise<void> },
        groupSize: number = config.groupSize
    ) {
        const groupList = this.averageList(data, groupSize)
        for (const objectGroup of groupList) {
            await func(objectGroup)
        }
    }

    averageList<T>(list: T[], groupSize: number = config.groupSize): T[][] {
        const groupList: T[][] = []
        let start = 0
        let end = 0

        while (start < list.length) {
            end = start + groupSize
            if (end > list.length) {
                end = list.length
            }

            const objectGroup = list.slice(start, end)
            groupList.push(objectGroup)
            start = end
        }
        return groupList
    }
}

export default new TestDataService()
