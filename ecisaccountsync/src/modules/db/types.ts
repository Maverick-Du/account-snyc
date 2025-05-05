
export enum IncrementStatus {
    SUCCESS = 1,
    DEFAULT = 0,
    FAIL = -1
}

export enum IncrementUpdateType {
    UserDel = "user_del",
    UserUpdate = "user_update",
    UserAdd = "user_add",
    DeptDel = "dept_del",
    DeptUpdate = "dept_update",
    DeptAdd = "dept_add",
    DeptMove = "dept_move",
    UserDeptAdd = "user_dept_add",
    UserDeptDel = "user_dept_del",
    UserDeptUpdate = "user_dept_update",
    UserDeptMove = "user_dept_move"
}

export enum SyncType {
    AUTO = "auto",//自动
    MANUAL = "manual",//重试
    ROLLBACK = "rollback",//回滚
    ROLLRETRY = "roll_retry",//回滚重试
}

export enum SourceType {
    BUILDIN = "buildin",
    SYNC = "sync"
}

export enum FullSyncStatus {
    TO_SYNC = 10,
    SYNC_ING = 50,
    SYNC_SUCCESS = 100,
    SYNC_CANCEL = -10,
    SYNC_DEL_WARN = -50,
    SYNC_SCOPE_WARN = -60,
    SYNC_FAIL = -100
}

export enum SyncJobSettingRateType {
    MIN = 'min',
    HOUR = 'hour'
}

export enum SyncJobSettingOpenStatus {
    ENABLE = 1,
    DISABLE = 0
}

export enum ScopeCheckType {
    PATH = 1,
    SELF = 50,
    ALL = 100
}

export enum SyncScopeStatus {
    ENABLE = 1,
    DISABLE = 0
}

export enum FullSyncUpdateType {
    UserDel = "user_del",
    UserUpdate = "user_update",
    UserAdd = "user_add",
    UserEnable = "user_enable",
    UserDisable = "user_disable",
    DeptDel = "dept_del",
    DeptUpdate = "dept_update",
    DeptAdd = "dept_add",
    DeptMove = "dept_move",
    UserDeptAdd = "user_dept_add",
    UserDeptDel = "user_dept_del",
    UserOrderUpdate = "user_order_update",
    MainDeptUpdate = "main_dept_update",
    UserOrderOrMainDeptUpdate = "user_order_main_update"
}

export enum RecordStatus {
    SUCCESS = 1,
    WARN = 0,
    FAIL = -1
}

export enum StatisticAnalyseTbType {
    User = "user",
    Dept = "dept",
    DeptUser = "dept_user"
}

export enum FullSyncStatisticAnalyseStatus {
    ANALYSE_DEFAULT = 10,
    ANALYSE_ING = 50,
    ANALYSE_SUCCESS = 100,
    ANALYSE_STOP = -50,
    ANALYSE_STOP_ING = -60,
    ANALYSE_FAIL = -100
}

export enum StatisticAnalyseOperateType {
    UserAdd = FullSyncUpdateType.UserAdd,
    UserDelete = FullSyncUpdateType.UserDel,
    UserUpdate = FullSyncUpdateType.UserUpdate,
    UserEnable = FullSyncUpdateType.UserEnable,
    UserDisable = FullSyncUpdateType.UserDisable,
    DeptAdd = FullSyncUpdateType.DeptAdd,
    DeptDelete = FullSyncUpdateType.DeptDel,
    DeptUpdate = FullSyncUpdateType.DeptUpdate,
    DeptMove = FullSyncUpdateType.DeptMove,
    DeptUserAdd = FullSyncUpdateType.UserDeptAdd,
    DeptUserDelete = FullSyncUpdateType.UserDeptDel,
    UserOrderUpdate = FullSyncUpdateType.UserOrderUpdate,
    MainDeptUpdate = FullSyncUpdateType.MainDeptUpdate,
    UserOrderOrMainDeptUpdate = FullSyncUpdateType.UserOrderOrMainDeptUpdate
}

export enum StatisticAnalyseErrType {
    UserAddErrorCount = "user_add_error_count",
    DeptAddErrorCount = "dept_add_error_count",
    DeptUserAddErrorCount = "dept_user_add_error_count",
    UserUnknownError = "user_unknow_error",
    DeptUnknownError = "dept_unknow_error",
    DeptUserUnknownError = "dept_user_unknow_error",
    UserAccountDisabled = "user_account_disabled",
    DeptIsNotEmpty = "dept_is_not_empty",
    DeptRootDeptExists = "dept_root_dept_exists",
    DeptNameInvalid = "dept_name_invalid",
    DeptAliasInvalid = "dept_alias_invalid",
    DeptNameExists = "dept_name_exists",
    DeptOrderISRefactoring = "dept_order_is_refactoring",
    DeptUserOrderISRefactoring = "dept_user_order_is_refactoring",
    UserParamFormatError = "user_param_format_error",
    DeptParamFormatError = "dept_param_format_error",
    UserValueInvalidError = "user_value_invalid_error",
    DeptValueInvalidError = "dept_value_invalid_error",
    UserParamUnsupported = "user_param_unsupported",
    UserAccountInvalid = "user_account_invalid",
    UserNickNameInvalid = "user_nick_name_invalid",
    UserGenderInvalid = "user_gender_invalid",
    UserEmployeeIdInvalid = "user_employee_id_invalid",
    UserMobilePhoneInvalid = "user_mobile_phone_invalid",
    UserEmailInvalid = "user_email_invalid",
    UserTelephoneInvalid = "user_telephone_invalid",
    UserTitleInvalid = "user_title_invalid",
    UserEmploymentTypeInvalid = "user_employment_type_invalid",
    UserEmploymentStatusInvalid = "user_employment_status_invalid",
    DeptMaxDepthLimit = "dept_max_depth_limit",
    UserPasswordWeak = "user_password_weak",
    UserExistCheckMemberUnionId = "user_exist_check_member_union_id",
    UserUnionIdAlreadyExist = "user_union_id_already_exist",
    DeptExistCheckDeptUnionId = "dept_exist_check_dept_union_id",
    DeptUnionIdAlreadyExist = "dept_union_id_already_exist",
    DeptUserAccountDeptNumLimit = "dept_user_account_dept_num_limit",
    UserFieldNameAlreadyExist = "user_field_name_alrteady_exist",
    UserCustomFieldLimitExceeded = "user_custom_field_limit_exceeded",
    UserCustonFieldValueLimitExceeded = "user_custom_field_value_limit_exceeded",
    UserCustomFieldValueExistSpeChar = "user_custom_field_value_exist_spechar",
    UserLoginNameExists = "user_login_name_exists",
    UserAvatarInvalid = "user_avatar_invalid",
    UserLeaderInvalid = "user_leader_invalid",
    // UserCustomFieldUrlTitleIsEmpty = "user_custom_field_url_title_is_empty",
    // UserCustomFieldUrlLinkIsEmpty = "user_custom_field_url_link_is_empty",
    // UserCustomFieldUrlTitleLimitExceeded = "user_custom_field_url_title_limit_exceeded",
    // UserCustomFieldUrlLinkLimitExceeded = "user_custom_field_url_link_limit_exceeded",
    // UserCustomFieldUrlLinkInvalid = "user_custom_field_url_link_invalid",
    UserMemberNumLimit = "user_member_num_limit",
    UserTitleNameAlreadyExist = "user_title_name_already_exist",
    
}

export const StatisticAnalyseTbToErrTypeMap: Map<StatisticAnalyseTbType, StatisticAnalyseErrType[]> = new Map([
    [StatisticAnalyseTbType.User, [
        StatisticAnalyseErrType.UserAccountDisabled,
        StatisticAnalyseErrType.UserParamFormatError,
        StatisticAnalyseErrType.UserValueInvalidError,
        StatisticAnalyseErrType.UserParamUnsupported,
        StatisticAnalyseErrType.UserAccountInvalid,
        StatisticAnalyseErrType.UserNickNameInvalid,
        StatisticAnalyseErrType.UserGenderInvalid,
        StatisticAnalyseErrType.UserEmployeeIdInvalid,
        StatisticAnalyseErrType.UserMobilePhoneInvalid,
        StatisticAnalyseErrType.UserEmailInvalid,
        StatisticAnalyseErrType.UserTelephoneInvalid,
        StatisticAnalyseErrType.UserTitleInvalid,
        StatisticAnalyseErrType.UserEmploymentTypeInvalid,
        StatisticAnalyseErrType.UserEmploymentStatusInvalid,
        StatisticAnalyseErrType.UserPasswordWeak,
        StatisticAnalyseErrType.UserExistCheckMemberUnionId,
        StatisticAnalyseErrType.UserUnionIdAlreadyExist,
        StatisticAnalyseErrType.UserFieldNameAlreadyExist,
        StatisticAnalyseErrType.UserCustomFieldLimitExceeded,
        StatisticAnalyseErrType.UserCustonFieldValueLimitExceeded,
        StatisticAnalyseErrType.UserCustomFieldValueExistSpeChar,
        StatisticAnalyseErrType.UserLoginNameExists,
        StatisticAnalyseErrType.UserAvatarInvalid,
        StatisticAnalyseErrType.UserLeaderInvalid,
        StatisticAnalyseErrType.UserMemberNumLimit,
        StatisticAnalyseErrType.UserTitleNameAlreadyExist,
        StatisticAnalyseErrType.UserUnknownError,
    ]],
    [StatisticAnalyseTbType.Dept, [
        StatisticAnalyseErrType.DeptIsNotEmpty,
        StatisticAnalyseErrType.DeptRootDeptExists,
        StatisticAnalyseErrType.DeptNameInvalid,
        StatisticAnalyseErrType.DeptAliasInvalid,
        StatisticAnalyseErrType.DeptNameExists,
        StatisticAnalyseErrType.DeptOrderISRefactoring,
        StatisticAnalyseErrType.DeptParamFormatError,
        StatisticAnalyseErrType.DeptValueInvalidError,
        StatisticAnalyseErrType.DeptMaxDepthLimit,
        StatisticAnalyseErrType.DeptExistCheckDeptUnionId,
        StatisticAnalyseErrType.DeptUnionIdAlreadyExist,
        StatisticAnalyseErrType.DeptUnknownError,
    ]],
    [StatisticAnalyseTbType.DeptUser, [
        StatisticAnalyseErrType.DeptUserOrderISRefactoring,
        StatisticAnalyseErrType.DeptUserAccountDeptNumLimit,
        StatisticAnalyseErrType.DeptUserUnknownError
    ]]
])

export const StatisticAnalyseTbToOperateMap: Map<StatisticAnalyseTbType, StatisticAnalyseOperateType[]> = new Map([
    [
        StatisticAnalyseTbType.User, [
            StatisticAnalyseOperateType.UserAdd,
            StatisticAnalyseOperateType.UserDelete,
            StatisticAnalyseOperateType.UserUpdate,
            StatisticAnalyseOperateType.UserEnable,
            StatisticAnalyseOperateType.UserDisable
        ]
    ],
    [
        StatisticAnalyseTbType.Dept, [
            StatisticAnalyseOperateType.DeptAdd,
            StatisticAnalyseOperateType.DeptDelete,
            StatisticAnalyseOperateType.DeptUpdate,
            StatisticAnalyseOperateType.DeptMove
        ]
    ],
    [
        StatisticAnalyseTbType.DeptUser, [
            StatisticAnalyseOperateType.DeptUserAdd,
            StatisticAnalyseOperateType.DeptUserDelete,
            StatisticAnalyseOperateType.UserOrderUpdate,
            StatisticAnalyseOperateType.MainDeptUpdate
        ]
    ]
])

export interface AnalyseListOvs {
    operate_type?: StatisticAnalyseOperateType,
    sync_tb_type?: StatisticAnalyseTbType,
    err_type?: StatisticAnalyseErrType
}