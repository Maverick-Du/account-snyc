import {IDatabase, Table} from "../../sdk/cognac/orm";
import {FullSyncUserRecord, FullSyncUserRecordTable} from "../db/tables/FullSyncUserRecord";
import {FullSyncDeptRecord, FullSyncDeptRecordTable} from "../db/tables/FullSyncDeptRecord";
import {FullSyncDeptUserRecord, FullSyncDeptUserRecordTable} from "../db/tables/FullSyncDeptUserRecord";
import {WPSDepartment, WPSUser} from "../../sdk/account";
import {FullSyncUpdateType, RecordStatus, StatisticAnalyseErrType, StatisticAnalyseTbType} from "../db/types";
import {FullSyncScopeSchema} from "../db/tables/FullSyncScope";
import config from "../../common/config";
import v7ErrRespProcess from "../full_sync_statistic_analyse/v7ErrRespProcess";

export class FullSyncRecordService {
    private db: IDatabase

    private fullSyncUserRecord: FullSyncUserRecordTable
    private fullSyncDeptRecord: FullSyncDeptRecordTable
    private fullSyncDeptUserRecord: FullSyncDeptUserRecordTable

    init(db: IDatabase) {
        this.db = db
        this.fullSyncUserRecord = new FullSyncUserRecordTable(this.db)
        this.fullSyncDeptRecord = new FullSyncDeptRecordTable(this.db)
        this.fullSyncDeptUserRecord = new FullSyncDeptUserRecordTable(this.db)
    }

    async addUserRecord(taskId: string, user: WPSUser, update: FullSyncUpdateType, status: RecordStatus, err?: any, dept?: WPSDepartment) {
        let errType: StatisticAnalyseErrType
        let msg: string
        if (status === RecordStatus.FAIL) {
            errType = v7ErrRespProcess.errProcess(StatisticAnalyseTbType.User ,err)
            msg = err.message?.substring(0, 2000)
        }
        let ovs = {
            task_id: taskId,
            company_id: user.company_id,
            name: user.nick_name,
            account: user.login_name,
            platform_id: user.third_platform_id,
            uid: user.third_union_id,
            abs_path: user.abs_path,
            update_type: update,
            status: status,
            msg: msg,
            err_type: errType
        } as FullSyncUserRecord
        if (update == FullSyncUpdateType.UserAdd) {
            ovs.wps_did = dept.dept_id
        }
        await this.fullSyncUserRecord.addRecord(ovs)
        if (update == FullSyncUpdateType.UserAdd) {
            await this.addDeptUserRecord(taskId, user, dept, FullSyncUpdateType.UserDeptAdd, status, err)
        }
    }

    async addUserRecords(ovs: Partial<FullSyncUserRecord>[]) {
        await this.groupOpt(ovs, async (items)=>{
            await this.fullSyncUserRecord.addRecords(items)
        })
    }

    async addDeptRecord(taskId: string, dept: WPSDepartment, update: FullSyncUpdateType, status: RecordStatus, err?: any) {
        let errType: StatisticAnalyseErrType
        let msg: string
        if (status === RecordStatus.FAIL) {
            errType = v7ErrRespProcess.errProcess(StatisticAnalyseTbType.Dept ,err)
            msg = err.message?.substring(0, 2000)
        }
        await this.fullSyncDeptRecord.addRecord({
            task_id: taskId,
            company_id: dept.company_id,
            name: dept.name,
            platform_id: dept.third_platform_id,
            did: dept.third_dept_id,
            wps_did: dept.dept_id,
            wps_pid: dept.dept_pid,
            abs_path: dept.abs_path,
            update_type: update,
            status: status,
            err_type: errType,
            msg: msg
        })
    }

    async addDeptRecords(ovs: Partial<FullSyncDeptRecord>[]) {
        await this.groupOpt(ovs, async (items)=>{
            await this.fullSyncDeptRecord.addRecords(items)
        })
    }

    async addDeptUserRecord(taskId: string, user: WPSUser, dept: WPSDepartment, update: FullSyncUpdateType, status: RecordStatus, err?: any) {
        let errType: StatisticAnalyseErrType
        let msg: string
        if (status === RecordStatus.FAIL) {
            errType = v7ErrRespProcess.errProcess(StatisticAnalyseTbType.DeptUser ,err)
            msg = err.message?.substring(0, 2000)
        }
        await this.fullSyncDeptUserRecord.addRecord({
            task_id: taskId,
            company_id: user.company_id,
            name: user.nick_name,
            account: user.login_name,
            platform_id: user.third_platform_id,
            uid: user.third_union_id,
            wps_did: dept.dept_id,
            abs_path: dept.abs_path,
            update_type: update,
            status: status,
            msg: msg,
            err_type: errType
        })
    }

    async addDeptUserRecords(ovs: Partial<FullSyncDeptUserRecord>[]) {
        await this.groupOpt(ovs, async (items)=>{
            await this.fullSyncDeptUserRecord.addRecords(items)
        })
    }

    async addDeptScopeRecord(taskId: string, dept: FullSyncScopeSchema) {
        await this.fullSyncDeptRecord.addRecord({
            task_id: taskId,
            company_id: dept.company_id,
            name: dept.name,
            platform_id: dept.platform_id,
            did: dept.did,
            abs_path: "",
            update_type: FullSyncUpdateType.DeptDel,
            status: RecordStatus.WARN,
            msg: "采集数据中不存在同步范围对应的部门"
        })
    }

    async countRecordData() {
        let deptCountData = await this.fullSyncDeptRecord.countData()
        let deptUserCountData = await this.fullSyncDeptUserRecord.countData()
        let userCountData = await this.fullSyncUserRecord.countData()

        const deptCountRows: any[] = Table.array(deptCountData.data.rows)
        let deptCount = deptCountRows[0]?.total
        const userCountRows: any[] = Table.array(userCountData.data.rows)
        let userCount = userCountRows[0]?.total
        const deptUserCountRows: any[] = Table.array(deptUserCountData.data.rows)
        let deptUserCount = deptUserCountRows[0]?.total
        return {
            deptCount: deptCount,
            userCount: userCount,
            deptUserCount: deptUserCount
        }
    }

    async deleteRecordDataByTaskId(taskId: string) {
        await this.fullSyncDeptRecord.deleteByTaskId(taskId)
        await this.fullSyncUserRecord.deleteByTaskId(taskId)
        await this.fullSyncDeptUserRecord.deleteByTaskId(taskId)
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

export default new FullSyncRecordService()
