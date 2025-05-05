import {CompanyCfg} from "../../../sdk/account";
import {IncrementSyncEngine} from "./IncrementSyncEngine";
import {LasDeptIncrementSchema} from "../../db/tables/LasDepartmentIncrement";
import {LasUserIncrementSchema} from "../../db/tables/LasUserIncrement";
import {LasDeptUserIncrementSchema} from "../../db/tables/LasDepartmentUserIncrement";
import {IncrementSyncTaskStatistics} from "../types";
import {decrypt, getEncryptKey} from "../../../sdk/common/crypto";
import {log, StrategyContext} from "../../../sdk/cognac";
import config from "../../../common/config";

export enum IncrementStrategyType {
    DeptDelete = 'increment.sync.dept.delete',
    DeptUpdate = 'increment.sync.dept.update',
    DeptAdd = 'increment.sync.dept.add',
    DeptMove = 'increment.sync.dept.move',

    UserDelete = 'increment.sync.user.delete',
    UserUpdate = 'increment.sync.user.update',
    UserAdd = 'increment.sync.user.add',

    UserDeptAdd = 'increment.sync.user.dept.add',
    UserDeptDelete = 'increment.sync.user.dept.delete',
    UserDeptUpdate = 'increment.sync.user.dept.update',
    UserDeptMove = 'increment.sync.user.dept.move',
}

export interface IncrementSyncContext extends StrategyContext {
    engine: IncrementSyncEngine
    cfg: CompanyCfg
    startTime: string
    endTime: string
    deptIncrement: LasDeptIncrementSchema
    userIncrement: LasUserIncrementSchema
    deptUserIncrement: LasDeptUserIncrementSchema
    statistics: IncrementSyncTaskStatistics
}

export function getOriginContent(user: LasUserIncrementSchema, content: string) {
    try {
        return decrypt(content, getEncryptKey(user.uid))
    } catch (err) {
        err.message = `increment sync user decrypt content error, id: ${user.id}, uid: ${user.uid}, content: ${content}, msg: ${err.message}`
        log.error(err)
        throw err
    }
}

export function getUserPassword(user: LasUserIncrementSchema) {
    try {
        let password = config.cloud.defaultPassword
        if (user.password) {
            password = decrypt(user.password, getEncryptKey(user.uid))
        }
        return password
    } catch (err) {
        err.message = `increment sync userAdd decrypt user password error, id: ${user.id}, uid: ${user.uid}, msg: ${err.message}`
        log.e(err)
        throw err
    }
}
