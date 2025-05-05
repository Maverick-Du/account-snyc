import {LocalMember, SyncStrategyType, WPSUser, WPSUserOptionalProperties} from "../../sync";
import {log, Ticker} from '../../../cognac/common';
import {
    IAddDeptUsersContext,
    IAddDeptUsersResult,
    IAddDeptUsersStrategy,
} from "../../sync/engine/strategies/AddDeptUserStrategy";
import config from "../../../../common/config";
import {decrypt, getEncryptKey} from "../../../common/crypto";
import {CountDownLatch} from "../../../../common/CountDownLatch";
import fullSyncRecordService from "../../../../modules/service/FullSyncRecordService";
import {FullSyncUpdateType, RecordStatus} from "../../../../modules/db/types";

export class AddDeptMembersStrategy implements IAddDeptUsersStrategy {
    name: string = SyncStrategyType.AddDepartmentMembers

    async exec(ctx: IAddDeptUsersContext): Promise<IAddDeptUsersResult> {
        const { engine, task, deptUsers } = ctx
        let latch = new CountDownLatch(deptUsers.length)
        for (const deptUser of deptUsers) {
            let dept = deptUser.dept
            let user = deptUser.user
            log.debug({ info: `full sync ${task.taskId} addDeptUser start. deptName: ${dept.name} deptId: ${dept.dept_id} uid: ${user.uid}` })
            try {
                const properties = {
                    source: user.source,
                    avatar: user.avatar ? user.avatar : null,
                    email: user.email ? user.email : null,
                    gender: user.gender ? user.gender : null,
                    telephone: user.telephone ? this.getOriginContent(task.taskId, user.uid, user.telephone, "telephone") : null,
                    mobile_phone: user.phone ? this.getOriginContent(task.taskId, user.uid, user.phone, "phone") : null,
                    title: user.title ? user.title : null,
                    work_place: user.work_place ? user.work_place : null,
                    employee_id: user.employer ? user.employer : null,
                    employment_type: user.employment_type ? user.employment_type : null,
                    custom_fields: user.custom_fields
                } as WPSUserOptionalProperties
                engine.was.addUser(
                    dept.company_id,
                    user.name,
                    this.getUserPassword(task.taskId, user),
                    user.nick_name,
                    user.platform_id,
                    user.uid,
                    dept.dept_id,
                    user.order || 0,
                    properties,
                ).then(u => {
                    latch.countDown()
                    log.i({ info: `full sync ${task.taskId} addDeptUser success deptName: ${dept.name} deptId: ${dept.dept_id} uid: ${user.uid}, userId: ${u.user_id}` })
                    u.abs_path = dept.abs_path
                    task.statistics.user_add++
                    task.statistics.dept_user_add++
                    fullSyncRecordService.addUserRecord(task.taskId, u, FullSyncUpdateType.UserAdd, RecordStatus.SUCCESS, null, dept)
                }).catch((err) => {
                    latch.countDown()
                    err.msg = `full sync ${task.taskId} addDeptUser throw error, did: ${dept.third_dept_id}, uid: ${user.uid}.`
                    if (err.request) {
                        // 去掉参数里面的敏感信息
                        err.request.data = null
                    }
                    log.e(err)
                    task.statistics.user_error++
                    task.statistics.user_add_error++
                    task.statistics.dept_user_error++
                    task.statistics.dept_user_add_error++
                    let us = {
                        user_id: null,
                        company_id: task.cfg.companyId,
                        login_name: user.name,
                        nick_name: user.nick_name,
                        third_platform_id: user.platform_id,
                        third_union_id: user.uid,
                        abs_path: dept.abs_path,
                    } as WPSUser
                    fullSyncRecordService.addUserRecord(task.taskId, us, FullSyncUpdateType.UserAdd, RecordStatus.FAIL, err, dept)
                })
            } catch (e) {
                latch.countDown()
                log.i(e)
                task.statistics.user_error++
                task.statistics.user_add_error++
                task.statistics.dept_user_error++
                task.statistics.dept_user_add_error++
                let us = {
                    user_id: null,
                    company_id: task.cfg.companyId,
                    login_name: user.name,
                    nick_name: user.nick_name,
                    third_platform_id: user.platform_id,
                    third_union_id: user.uid,
                    abs_path: dept.abs_path,
                } as WPSUser
                await fullSyncRecordService.addUserRecord(task.taskId, us, FullSyncUpdateType.UserAdd, RecordStatus.FAIL, e, dept)
            }
            task.statistics.sync_user++
            task.statistics.sync_dept_user++
        }
        await latch.await()
        return {code: "ok"}
    }

    getUserPassword(taskId: string, user: LocalMember) {
        try {
            let password = config.cloud.defaultPassword
            if (user.password) {
                password = decrypt(user.password, getEncryptKey(user.uid))
            }
            return password
        } catch (err) {
            err.message = `full sync ${taskId} addDeptUser decrypt user password error, taskId: ${taskId}, uid: ${user.uid}, msg: ${err.message}`
            log.i(err)
            throw err
        }
    }

    getOriginContent(taskId: string, uid: string, content: string, field: string) {
        try {
            return decrypt(content, getEncryptKey(uid))
        } catch (err) {
            err.message = `full sync ${taskId} addDeptUser decrypt ${field} error, taskId: ${taskId}, uid: ${uid}, content: ${content}, msg: ${err.message}`
            throw err
        }
    }

}
