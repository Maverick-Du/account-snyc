import {IDatabase} from "../../sdk/cognac/orm";
import {FullSyncScopeSchema, FullSyncScopeTable} from "../db/tables/FullSyncScope";
import {
    CheckType,
    FullSyncScopeCheckData,
    FullSyncScopeData,
    FullSyncScopeParentChainData,
    FullSyncScopeResponseData
} from "./types";
import {ScopeCheckType, SyncScopeStatus} from "../db/types";
import {CompanyCfg, LocalDepartment} from "../../sdk/account";
import {LockKey} from "../lock/LockService";
import {lockService} from "../lock";
import {Result} from "../../common/type";
import fullSyncTaskService from "../service/FullSyncTaskService";
import {FullSyncScopeVersionTable} from "../db/tables/FullSyncScopeVersion";
import sync from '../../modules/sync'
import config from "../../common/config";
import { log } from "../../sdk/cognac";

export class FullSyncScopeService {
    private db: IDatabase
    private fullSyncScopeTable: FullSyncScopeTable
    private fullSyncScopeVersionTable: FullSyncScopeVersionTable
    CUR_DEPT_PREFIX = "::cur_dept_all_user::"

    init(db: IDatabase) {
        this.db = db
        this.fullSyncScopeTable = new FullSyncScopeTable(this.db)
        this.fullSyncScopeVersionTable = new FullSyncScopeVersionTable(this.db)
    }

    async getAllCheckDepts(companyId: string, platformId?: string) {
        let checkDepts = await this.fullSyncScopeTable.getAllEnableScopes(companyId, platformId)
        let scopeVersion = await this.fullSyncScopeVersionTable.getScopeVersion(companyId)
        if (!scopeVersion) {
            await this.fullSyncScopeVersionTable.addConfig({company_id: companyId, scope_version: 1})
            scopeVersion = await this.fullSyncScopeVersionTable.getScopeVersion(companyId)
        }
        return {checkDepts, scopeVersion}
    }

    async saveCheckList(cfg: CompanyCfg, taskId: string, datas: FullSyncScopeCheckData[], operator: string) {
        let tempMap = new Map<string, FullSyncScopeSchema>()
        let checkDatas = await this.fullSyncScopeTable.getAllEnableScopes(cfg.companyId)
        checkDatas.forEach(x => tempMap.set(`${x.did}${config.splitSymbol}${x.platform_id}`, x))

        let updateFlag = false
        let updateArr = []
        let addArr = []
        for (const data of datas) {
            let check_type = ScopeCheckType.ALL
            let did = data.did
            if (data.did.startsWith(this.CUR_DEPT_PREFIX)) {
                check_type = ScopeCheckType.SELF
                did = data.did.slice(this.CUR_DEPT_PREFIX.length, data.did.length)
            }
            let key = `${did}${config.splitSymbol}${data.platform_id}`
            let exist = tempMap.get(key)
            if (exist) {
                // 修改
                if (exist.check_type != check_type || exist.name != data.name) {
                    updateArr.push({id: exist.id, did: exist.did, name: data.name, check_type: check_type})
                }
                tempMap.delete(key)
            } else {
                // 新增
                let obs = {
                    company_id: cfg.companyId,
                    platform_id: data.platform_id,
                    did: did,
                    name: data.name,
                    check_type: check_type,
                    operator: operator,
                    status: SyncScopeStatus.ENABLE
                } as FullSyncScopeSchema
                addArr.push(obs)
            }
        }
        // 删除
        let delDids = []
        let deleteScopes = await this.getDeleteScopes(taskId, cfg.thirdCompanyId, checkDatas)
        for (const en of tempMap.entries()) {
            if (!deleteScopes.has(en[0])) {
                updateFlag = true
            }
            delDids.push(en[1].id)
        }

        let lockId = 0
        let lockKey = `${LockKey.UPDATE_SYNC_SCOPE}_${cfg.companyId}`
        try {
            lockId = await lockService.tryLock(lockKey, `${lockKey}_save_check_list`)
            if (lockId <= 0) {
                log.i({info: `saveCheckList exit. reason: not get lock`})
                return new Result(Result.FAIL_CODE, "同步任务运行中，请稍后设置同步范围")
            }
            // 修改 新增 删除
            if (updateArr.length > 0) {
                updateFlag = true
                for (const u of updateArr) {
                    await this.fullSyncScopeTable.updateScope(u.id, u.name, u.check_type, operator)
                }
            }
            if (addArr.length > 0) {
                updateFlag = true
                for (const obs of addArr) {
                    await this.fullSyncScopeTable.addScope(obs)
                }
            }
            if (delDids.length > 0) {
                await this.fullSyncScopeTable.deleteScopes(delDids, operator)
            }
            if (updateFlag) {
                let scopeVersion = await this.fullSyncScopeVersionTable.getScopeVersion(cfg.companyId)
                if (!scopeVersion) {
                    await this.fullSyncScopeVersionTable.addConfig({company_id: cfg.companyId, scope_version: 1})
                } else {
                    await this.fullSyncScopeVersionTable.updateScopeVersion(cfg.companyId)
                }
            }

            return new Result(Result.SUCCESS_CODE, "success")
        } catch (err) {
            err.msg = `saveCheckList throw error. companyId: ${cfg.companyId}, operator: ${operator}, msg: ${err.message}`
            log.i(err)
            return new Result(Result.FAIL_CODE, err.message)
        } finally {
            if (lockId > 0) {
                await lockService.releaseLock(lockId, lockKey)
            }
        }
    }

    async getDeleteScopes(taskId: string, thirdCompanyId: string, checkDepts: FullSyncScopeSchema[]) {
        let didsMap = new Map<string, string[]>()
        let checkMap = new Map<string, FullSyncScopeSchema>()
        checkDepts.forEach(x => {
            let dids = didsMap.get(x.platform_id)
            if (dids) {
                dids.push(x.did)
            } else {
                dids = []
                didsMap.set(x.platform_id, dids)
                dids.push(x.did)
            }
            checkMap.set(`${x.did}${config.splitSymbol}${x.platform_id}`, x)
        })
        for (const entry of didsMap.entries()) {
            let platformId = entry[0]
            let dids = entry[1]
            // 查las表并确认勾选的部门是否都存在
            let lasDepts = await sync.ctx.engine.las.getDepartmentsNoCheck(taskId, thirdCompanyId, platformId, dids)
            for (let lasDept of lasDepts) {
                checkMap.delete(`${lasDept.did}${config.splitSymbol}${lasDept.platform_id}`)
            }
        }
        return checkMap
    }

    /**
     * 1. 查两层
     * 2. 查勾选部门路径（找到不存在的勾选部门）
     * 3. 当部门未勾选时，判断该部门是否在路径上
     * @param cfg
     * @param platformId
     * @param did
     * @param taskId
     */

    async getScopeList(cfg: CompanyCfg, platformId?: string, did?: string, taskId?: string) {
        try {
            if (!taskId) {
                // 最新的一次任务
                let task = await fullSyncTaskService.getLatestTask(cfg.companyId)
                if (!task) {
                    // 状态码改为200，前端特殊处理不弹toast
                    return new Result(Result.SUCCESS_CODE, "未找到同步任务的数据，无法设置同步范围")
                }
                taskId = fullSyncTaskService.getOriginTaskId(task.task_id)
            }
            let root = await sync.ctx.engine.las.root(taskId, cfg.thirdCompanyId)
            let checkDatas: FullSyncScopeSchema[]
            let dept: LocalDepartment
            if (!did || did == root.did) {
                dept = root
                checkDatas = await this.fullSyncScopeTable.getAllEnableScopes(cfg.companyId)
            } else {
                dept = await sync.ctx.engine.las.getDepartmentNoCheck(taskId, cfg.thirdCompanyId, platformId, did)
                if (!dept) {
                    throw new Error(`未找到对应的部门信息, did: ${did}`)
                }
                checkDatas = await this.fullSyncScopeTable.getAllEnableScopes(cfg.companyId, platformId)
            }

            return new Result(Result.SUCCESS_CODE, "success", await this.getSecondLayerDeptChek(taskId, cfg, dept, root, checkDatas))
        } catch (err) {
            err.msg = `getScopeList throw error. companyId: ${cfg.companyId}, platformId: ${platformId}, did: ${did}, msg: ${err.message}`
            log.i(err)
            return new Result(Result.FAIL_CODE, `查询失败, msg: ${err.message}`)
        }
    }

    async getSecondLayerDeptChek(taskId: string, cfg: CompanyCfg, dept: LocalDepartment, root: LocalDepartment, checkDatas: FullSyncScopeSchema[]): Promise<FullSyncScopeResponseData> {
        let checkMap = new Map<string, FullSyncScopeSchema>()
        checkDatas.forEach(x => checkMap.set(`${x.did}${config.splitSymbol}${x.platform_id}`, x))

        let childs: LocalDepartment[] = []
        if (dept.did == root.did) {
            for (const platId of cfg.platformIdList) {
                let cds = await sync.ctx.engine.las.listDepartmentsNoCheck(dept.task_id, cfg.thirdCompanyId, platId, dept.did)
                childs.push(...cds)
            }
        } else {
            childs = await sync.ctx.engine.las.listDepartmentsNoCheck(dept.task_id, cfg.thirdCompanyId, dept.platform_id, dept.did)
        }
        let checkType: ScopeCheckType
        if (checkDatas.length <= 0) {
            checkType = ScopeCheckType.ALL
        } else {
            checkType = checkMap.get(`${dept.did}${config.splitSymbol}${dept.platform_id}`)?.check_type
        }

        let obj = this.buildFullSyncScopeData(dept, checkType, childs)
        if (childs.length > 0) {
            obj.subs.push(this.buildDeptMemberCheckData(dept, checkType))
        }
        if (checkType == ScopeCheckType.ALL) {
            childs.forEach(x => obj.subs.push(this.buildFullSyncScopeData(x, checkType, [])))
            return {task_id: taskId, scope: obj, deleteScopes: []}
        } else {
            let parentChainData = await this.getCheckDeptParents(cfg, taskId, root, checkDatas)
            for (const child of childs) {
                obj.subs.push(await this.getDeptChainCheckData(parentChainData.pidSet, checkMap, child))
            }
            return {task_id: taskId, scope: obj, deleteScopes: dept.did == root.did ? parentChainData.deleteScopes : []}
        }
    }

    buildFullSyncScopeData(dept: LocalDepartment, checkType: ScopeCheckType, childs: LocalDepartment[]) {
        let check_type = CheckType.NO
        if (checkType && checkType == ScopeCheckType.ALL) {
            check_type = CheckType.YES
        }
        if (checkType && checkType == ScopeCheckType.SELF && childs.length <= 0) {
            check_type = CheckType.YES
        }
        return {
            task_id: dept.task_id,
            platform_id: dept.platform_id,
            did: dept.did,
            name: dept.name,
            check_type: check_type,
            subs: []
        } as FullSyncScopeData
    }

    buildDeptMemberCheckData(dept: LocalDepartment, checkType: ScopeCheckType) {
        return {
            task_id: dept.task_id,
            platform_id: dept.platform_id,
            did: `${this.CUR_DEPT_PREFIX}${dept.did}`,
            name: "本部门所有直属成员",
            check_type: checkType ? CheckType.YES : CheckType.NO,
            subs: []
        } as FullSyncScopeData
    }

    /**
         判断当前部门是否勾选
            全选，构建并返回
            仅选，构建
            未选，构建

         判断当前部门是否是父路径
            是，则查子部门列表
                遍历子部门列表
     * @param pidSet 父路径pid
     * @param checkMap 勾选map
     * @param child 子部门
     */
    async getDeptChainCheckData(pidSet: Set<string>, checkMap: Map<string, FullSyncScopeSchema>, child: LocalDepartment) {
        let childCheck = checkMap.get(`${child.did}${config.splitSymbol}${child.platform_id}`)
        if (childCheck && childCheck.check_type == ScopeCheckType.ALL) {
            return this.buildFullSyncScopeData(child, childCheck.check_type, [])
        }
        let obj: FullSyncScopeData
        if (pidSet.has(`${child.did}${config.splitSymbol}${child.platform_id}`)) {
            let cds = await sync.ctx.engine.las.listDepartmentsNoCheck(child.task_id, child.third_company_id, child.platform_id, child.did)
            obj = this.buildFullSyncScopeData(child, childCheck ? childCheck.check_type : null, cds)
            if (cds.length > 0) {
                obj.subs.push(this.buildDeptMemberCheckData(child, childCheck ? childCheck.check_type : null))
            }
            for (const cd of cds) {
                obj.subs.push(await this.getDeptChainCheckData(pidSet, checkMap, cd))
            }
        } else {
            if (childCheck && childCheck.check_type == ScopeCheckType.SELF) {
                let cds = await sync.ctx.engine.las.listDepartmentsNoCheck(child.task_id, child.third_company_id, child.platform_id, child.did)
                obj = this.buildFullSyncScopeData(child, childCheck ? childCheck.check_type : null, cds)
                if (cds.length > 0) {
                    obj.subs.push(this.buildDeptMemberCheckData(child, childCheck ? childCheck.check_type : null))
                }
                for (const cd of cds) {
                    obj.subs.push(this.buildFullSyncScopeData(cd, null, []))
                }
            }
        }
        return obj ? obj : this.buildFullSyncScopeData(child, null, [])
    }

    async getCheckDeptParents(cfg: CompanyCfg, taskId: string, root: LocalDepartment, checkDepts: FullSyncScopeSchema[]): Promise<FullSyncScopeParentChainData> {
        let didsMap = new Map<string, string[]>()
        let pidSet = new Set<string>()
        let checkMap = new Map<string, FullSyncScopeSchema>()
        checkDepts.forEach(x => {
            let dids = didsMap.get(x.platform_id)
            if (dids) {
                dids.push(x.did)
            } else {
                dids = []
                didsMap.set(x.platform_id, dids)
                dids.push(x.did)
            }
            checkMap.set(`${x.did}${config.splitSymbol}${x.platform_id}`, x)
        })
        for (const entry of didsMap.entries()) {
            let platformId = entry[0]
            let dids = entry[1]
            let lasDepts = await sync.ctx.engine.las.getDepartmentsNoCheck(taskId, cfg.thirdCompanyId, platformId, dids)
            for (let lasDept of lasDepts) {
                checkMap.delete(`${lasDept.did}${config.splitSymbol}${lasDept.platform_id}`)
                let ld = lasDept
                while (ld.pid != root.did) {
                    if (pidSet.has(`${ld.pid}${config.splitSymbol}${ld.platform_id}`)) {
                        break
                    }
                    pidSet.add(`${ld.pid}${config.splitSymbol}${ld.platform_id}`)
                    ld = await sync.ctx.engine.las.getDepartmentNoCheck(taskId, cfg.thirdCompanyId, platformId, ld.pid)
                    if (!ld) {
                        break
                    }
                }
            }
        }
        let deleteScopes = []
        for (const c of checkMap.values()) {
            deleteScopes.push(c)
        }
        return {
            pidSet,
            deleteScopes
        }
    }

    async deleteDisableScopeConfig(time: string) {
        await this.fullSyncScopeTable.deleteDisableScopeConfig(time)
    }
}

export default new FullSyncScopeService()
