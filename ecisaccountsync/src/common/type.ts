import {WPS4Result} from "../sdk/common/wps4";

export class Result<T = any> {
    static SUCCESS_CODE = "200"
    static PARAM_ERROR_CODE = "400"
    static NOT_LOGIN_CODE = "401"
    static NOT_ROLE_PERMISSION = "403"
    static FAIL_CODE = "500"
    static SYNCING_CODE = "505"

    code: string
    msg: string
    data: T

    constructor(code: string, msg: string, data?: T) {
        this.code = code
        this.msg = msg
        this.data = data
    }

    checkSuccess() {
        return this.code == Result.SUCCESS_CODE
    }
}

export interface GetCurrentUserResult extends WPS4Result {
    data?: AccountUser
}

export interface AccountUser {
    account: string,
    avatar: string,
    company_id: string,
    login_mode: string,
    nick_name: string,
    role: string,
    status: string,
    user_id: string
}

export interface CheckCurrentUserRolePermissionResult extends WPS4Result {
    detail?: string
    data: {
        is_super_admin: boolean  // 是否超管
        items: {
            is_exists: boolean // 是否拥有该权限
            is_global_scope: boolean // 是否拥有全局范围的权限
            permission_key: string  // 权限key
            scope: string  // 权限范围
        }[]
    }
}

export enum PlatformType {
    cloud_doc = "cloud_doc",
    admin = "admin",
    third_party_app = "third_party_app"
}

export interface AuditOpType {
    hidden?: boolean
    op_key: string
    op_value: string
    p_op_key: string
    rank?: string
}

export interface AuditScriptsType {
    op_key: string
    script: string
}

export interface AuditLogType {
    result: {
        success: boolean
    }
    what: {
        log_category: string  //日志大类 Enum: "document_op" "admin_op" "group_op" "login_op"
        meta_data: string // 必须是可以解析的json格式,业务侧自己注入必要的信息
        op_key: string
    }
    when: {
        op_time: number
    }
    where: {
        app_id: string,  // 应用ID
        app_name: string,  // 应用名称
        device_info: string , // 设备信息
        ip_addr: string , // ip地址
        platform_type: PlatformType     //平台类型,日志来源 Enum: "cloud_doc" "admin" "third_party_app"
    }
    who: {
        comp_id: string // 组织ID
        operator_id: string //操作者ID
    }
}


