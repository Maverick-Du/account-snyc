import {IncrementStrategyType, IncrementSyncContext} from '../types'
import {IncrementStatus} from '../../../db/types'
import las from '../../../service/LasIncrementService'
import {LasDeptIncrementSchema} from '../../../db/tables/LasDepartmentIncrement'
import {CheckResponseData} from './IncrementDeptAddStrategy'
import sync from '../../../sync'
import {DEFAULT_ROOT_DEPT_P_ID, WPSDepartment} from "../../../../sdk/account";
import {WpsApiErrorCode} from "../../../sync/types";
import config from "../../../../common/config";
import {IncrementSyncDeptNameConflict} from "../../types";
import {md5} from "../../../../common/util";
import {log, Strategy, StrategyResult} from "../../../../sdk/cognac";

export class IncrementDeptUpdateStrategy implements Strategy<IncrementSyncContext, StrategyResult> {
    name: string = IncrementStrategyType.DeptUpdate

    async exec(ctx: IncrementSyncContext): Promise<StrategyResult> {
        ctx.statistics.total ++
        let dept = ctx.deptIncrement
        let exist: WPSDepartment
        log.i({ info: `increment sync deptUpdate companyId: ${ctx.cfg.companyId}, did: ${dept.did}, pid: ${dept.pid}, name: ${dept.name}, source: ${dept.source}, order: ${dept.order} start`})
        try {
            let data = await this.checkDeptData(ctx, dept)
            if (!data.flag) {
                ctx.statistics.dept_fail++
                await las.updateDeptSyncData(dept.id, IncrementStatus.FAIL, data.msg)
                return null
            }
            if (data.exist) {
                // update
                ctx.statistics.dept_update ++
                exist = data.exist
                let order: number = Number.isInteger(dept.order) ? dept.order : exist.order
                if (dept.name !== exist.name || order !== exist.order) {
                    // update
                    await sync.ctx.engine.was.updateDepartment(exist.company_id, exist, null, dept.name, order)
                }
                if (data.parent) {
                    let parent = data.parent
                    if (exist.dept_pid != parent.dept_id) {
                        // move
                        ctx.statistics.dept_move ++
                        await sync.ctx.engine.was.moveDepartment(exist.company_id, exist, parent)
                    }
                }
            } else {
                // add
                ctx.statistics.dept_add ++
                let parent = data.parent
                await sync.ctx.engine.was.addDepartment(parent.company_id, parent.dept_id, dept.platform_id, dept.did, dept.name,  dept.order || 0, dept.source, dept.type)
            }

            await las.updateDeptSyncData(dept.id, IncrementStatus.SUCCESS, data.msg)
        } catch (err) {
            let flag = await this.handleDeptNameExists(err, exist, dept)
            if (flag) {
                await las.updateDeptSyncData(dept.id, IncrementStatus.SUCCESS, "success")
            } else {
                err.msg = `increment sync deptUpdate throw error. msg: ${err.message}, dept: ${JSON.stringify(dept)}`
                log.e(err)
                ctx.statistics.dept_fail++
                await las.updateDeptSyncData(dept.id, IncrementStatus.FAIL, err.message?.substring(0,2000))
            }
        }
        log.i({ info: `increment sync deptUpdate companyId: ${ctx.cfg.companyId}, did: ${dept.did} end`})
        return null
    }

    async handleDeptNameExists(err: any, exist: WPSDepartment, dept: LasDeptIncrementSchema) {
        try {
            let resCode = err.response?.data?.code
            if (resCode == WpsApiErrorCode.DeptNameExists) {
                if (config.strategy.dept_name_conflict == IncrementSyncDeptNameConflict.RENAME) {
                    let suffix: string
                    if (dept.did.length > 16) {
                        let md5Str = md5(dept.did)
                        suffix = `_${md5Str}`
                    } else {
                        suffix = `_${dept.did}`
                    }
                    let name = `${dept.name}${suffix}`
                    if (name.length > 255) {
                        name = `${dept.name.substring(0, 255 - suffix.length)}${suffix}`
                    }
                    let order: number = Number.isInteger(dept.order) ? dept.order : exist.order
                    await sync.ctx.engine.was.updateDepartment(exist.company_id, exist, null, name, order)
                    log.i({ info: `increment sync deptUpdate handleDeptNameExists success. deptName: ${name}, deptId: ${exist.dept_id}` })
                    return true
                }
            }
            return false
        } catch (er) {
            er.msg = `increment sync deptUpdate handleDeptNameExists throw error. msg: ${er.message}, dept: ${JSON.stringify(dept)}`
            log.e(er)
            return false
        }
    }

    async checkDeptData(ctx: IncrementSyncContext, dept: LasDeptIncrementSchema): Promise<CheckResponseData> {
        try {
            let cfg = ctx.cfg
            let companyId = cfg.companyId
            if (!dept.name && !dept.order) {
                return {
                    flag: false,
                    msg: `未找到要修改的字段，name/order都为空`
                }
            }
            let parent = null
            if (dept.pid) {
                if (dept.pid == DEFAULT_ROOT_DEPT_P_ID) {
                    parent = await sync.ctx.engine.was.root(companyId)
                    if (!parent) {
                        return {
                            flag: false,
                            msg: `未找到对应的根部门信息, pid: ${dept.pid}`
                        }
                    }
                } else {
                    parent = await sync.ctx.engine.was.queryDeptsByThirdUnionId(companyId, dept.platform_id, dept.pid)
                    if (!parent) {
                        return {
                            flag: false,
                            msg: `未找到对应的父部门信息, pid: ${dept.pid}`
                        }
                    }
                }
            }

            let exist = await sync.ctx.engine.was.queryDeptsByThirdUnionId(companyId, dept.platform_id, dept.did)
            if (!exist && !parent) {
                return {
                    flag: false,
                    msg: `部门不存在, did: ${dept.did}`
                }
            }

            return {
                parent: parent,
                exist: exist,
                flag: true,
                msg: "success"
            }
        } catch (err) {
            err.msg = `increment sync deptUpdate handleDeptData throw error. msg: ${err.message}, dept: ${JSON.stringify(dept)}`
            log.e(err)
            return {
                flag: false,
                msg: err.message
            }
        }
    }
}
