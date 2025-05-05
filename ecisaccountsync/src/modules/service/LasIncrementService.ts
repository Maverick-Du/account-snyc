import {IDatabase, Table} from "../../sdk/cognac/orm";
import {LasUserIncrementTable} from "../db/tables/LasUserIncrement";
import {LasDepartmentIncrementTable} from "../db/tables/LasDepartmentIncrement";
import {LasDepartmentUserIncrementTable} from "../db/tables/LasDepartmentUserIncrement";
import {RootDeptUserTempSchema, RootDeptUserTempTable} from "../db/tables/RootDeptUserTemp";
import {SyncJobSettingTable} from "../db/tables/SyncJobSetting";
import {IncrementStatus} from "../db/types";
import * as util from "../../common/util";

export class LasIncrementService {
    private userIncrementTable: LasUserIncrementTable
    private deptIncrementTable: LasDepartmentIncrementTable
    private deptUserIncrementTable: LasDepartmentUserIncrementTable

    private rootDeptUserTempTable: RootDeptUserTempTable
    private syncJobSettingTable: SyncJobSettingTable

    init(collectDb: IDatabase, selfDb: IDatabase) {
        this.userIncrementTable = new LasUserIncrementTable(collectDb)
        this.deptIncrementTable = new LasDepartmentIncrementTable(collectDb)
        this.deptUserIncrementTable = new LasDepartmentUserIncrementTable(collectDb)
        this.rootDeptUserTempTable = new RootDeptUserTempTable(selfDb)
        this.syncJobSettingTable = new SyncJobSettingTable(selfDb)
    }

    async queryDeptSyncData(thirdCompanyId: string, startTime: string, endTime: string) {
        return this.deptIncrementTable.querySyncData(thirdCompanyId, startTime, endTime)
    }

    async updateDeptSyncData(id: number, status: IncrementStatus, msg: string) {
        return this.deptIncrementTable.updateDeptIncrement(id, status, msg)
    }

    async queryUserSyncData(thirdCompanyId: string, startTime: string, endTime: string) {
        return this.userIncrementTable.querySyncData(thirdCompanyId, startTime, endTime)
    }

    async countUserSyncDataNum(thirdCompanyId: string, startTime: string, endTime: string): Promise<number> {
        let userCountData = await this.userIncrementTable.countSyncData(thirdCompanyId, startTime, endTime)
        const userCountRows: any[] = Table.array(userCountData.data.rows)
        return userCountRows[0] ? userCountRows[0]?.total : 0
    }

    async countDeptSyncDataNum(thirdCompanyId: string, startTime: string, endTime: string): Promise<number> {
        let deptCountData = await this.deptIncrementTable.countSyncData(thirdCompanyId, startTime, endTime)
        const deptCountRows: any[] = Table.array(deptCountData.data.rows)
        return deptCountRows[0] ? deptCountRows[0]?.total : 0
    }

    async countDeptUserSyncDataNum(thirdCompanyId: string, startTime: string, endTime: string): Promise<number> {
        let deptUserCountData = await this.deptUserIncrementTable.countSyncData(thirdCompanyId, startTime, endTime)
        const deptUserCountRows: any[] = Table.array(deptUserCountData.data.rows)
        return deptUserCountRows[0] ? deptUserCountRows[0]?.total : 0
    }

    async getUserMaxEndTime(thirdCompanyId: string, startTime: string, max: number): Promise<Date> {
        return this.userIncrementTable.getMaxEndTime(thirdCompanyId, startTime, max)
    }

    async getDeptMaxEndTime(thirdCompanyId: string, startTime: string, max: number): Promise<Date> {
        return this.deptIncrementTable.getMaxEndTime(thirdCompanyId, startTime, max)
    }

    async getDeptUserMaxEndTime(thirdCompanyId: string, startTime: string, max: number): Promise<Date> {
        return this.deptUserIncrementTable.getMaxEndTime(thirdCompanyId, startTime, max)
    }

    async queryDeptUserSyncData(thirdCompanyId: string, startTime: string, endTime: string) {
        return this.deptUserIncrementTable.querySyncData(thirdCompanyId, startTime, endTime)
    }

    async deleteDataByTime(time: string) {
        await this.userIncrementTable.deleteDataByTime(time)
        await this.deptIncrementTable.deleteDataByTime(time)
        await this.deptUserIncrementTable.deleteDataByTime(time)
    }

    async updateUserSyncData(id: number, status: IncrementStatus, msg: string) {
        return this.userIncrementTable.updateUser(id, status, msg)
    }

    async updateDeptUserSyncData(id: number, status: IncrementStatus, msg: string) {
        return this.deptUserIncrementTable.updateDeptUserIncrement(id, status, msg)
    }

    async getDeptIncrementDetail(id: number, thirdCompanyId: string) {
        return this.deptIncrementTable.getDeptIncrementDetail(id, thirdCompanyId)
    }

    async getUserIncrementDetail(id: number, thirdCompanyId: string) {
        return this.userIncrementTable.getUserIncrementDetail(id, thirdCompanyId)
    }

    async getDeptUserIncrementDetail(id: number, thirdCompanyId: string) {
        return this.deptUserIncrementTable.getDeptUserIncrementDetail(id, thirdCompanyId)
    }

    async addRootDeptTempUser(ovs: Partial<RootDeptUserTempSchema>) {
        ovs.uid = util.getFieldDbContent(ovs.uid)
        let data = await this.getRootDeptTempUser(ovs.company_id, ovs.uid)
        if (!data) {
            return this.rootDeptUserTempTable.addRootUserTemp(ovs)
        }
        return 1
    }

    async delRootDeptTempUser(companyId: string, uid: string) {
        uid = util.getFieldDbContent(uid)
        return this.rootDeptUserTempTable.deleteRootUserTemp(companyId, uid)
    }

    async getRootDeptTempUser(companyId: string, uid: string) {
        uid = util.getFieldDbContent(uid)
        let temp = await this.rootDeptUserTempTable.getRootUserTemp(companyId, uid)
        if (temp?.uid) {
            temp.uid = util.getFieldOriginContent(temp.uid)
        }
        return temp
    }

    async getOlderTime() {
        let userOlderTime = await this.userIncrementTable.getOlderTime()
        let deptUserOlderTime = await this.deptUserIncrementTable.getOlderTime()
        let deptOlderTime = await this.deptIncrementTable.getOlderTime()
        return {
            userOlderTime: userOlderTime,
            deptUserOlderTime: deptUserOlderTime,
            deptOlderTime: deptOlderTime
        }
    }

    async countLasData() {
        let deptCountData = await this.deptIncrementTable.countData()
        let deptUserCountData = await this.deptUserIncrementTable.countData()
        let userCountData = await this.userIncrementTable.countData()
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


}

export default new LasIncrementService()
