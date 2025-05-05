import ZH_CN from "@/assets/i18n/locales/zh-CN";

// 默认接口返回值
export enum ResponseCode {
  SUCCESS = "200",
}
// 接口服务名
export const service = "c/ecisaccountsync";
// 鉴权菜单key值
export const MENU_KEY = "contacts.account_sync";

export const SYNC_FULL = "full";
export const SYNC_INCREMENT = "increment";

// 同步/异步 列表每页显示数量
export const PAGE_SIZE = 10;

// 增量同步状态
export const INCREMENT_SYNC_SUCCESS = 1;
export const INCREMENT_SYNC_ERROR = -1;

// 全量同步状态
export const FULL_SYNC_WAIT = 10;
export const FULL_SYNCING = 50;
export const FULL_SYNC_SUCCESS = 100;
export const FULL_SYNC_ERROR = -100;
export const FULL_SYNC_CANCEL = -10;
export const FULL_SYNC_THRESHOLD_WARN = -50;
export const FULL_SYNC_RANGE_WARN = -60;

// 同步方式
export const AUTO_SYNC = "auto";
export const MANUAL_SYNC = "manual";
export const ROLLBACK_SYNC = "rollback";
export const ROLL_RETRY_SYNC = "roll_retry";

// 同步类型
export const TYPE_USER = "user";
export const TYPE_DEPT = "dept";
export const TYPE_USER_DEPT = "user_dept";

// 增量更新间隔时间
export const TIME_MIN = "min";
export const TIME_HOUR = "hour";

// 全量同步设置类型
export const SYNC_FULL_SETTING_AUTO = "auto";
export const SYNC_FULL_SETTING_THRESHOLD = "threshold";
export const SYNC_FULL_SETTING_RANGE = "range";
export const SYNC_FULL_SETTING_ROLLBACK = "rollback";
export const SYNC_FULL_SETTING_DEFAULT = "default";

// 增量同步设置类型
export const SYNC_INCREMENT_SETTING_AUTO = "auto";
export const SYNC_INCREMENT_SETTING_FREQUENCY = "frequency";
export const SYNC_INCREMENT_SETTING_DEFAULT = "default";

export const SYNC_INCREMENT_SETTING_TYPE: TIncrementSyncSettingType[] = [
  SYNC_INCREMENT_SETTING_AUTO,
  SYNC_INCREMENT_SETTING_FREQUENCY,
];

// 全量同步设置类型列表
export const SYNC_FULL_SETTING_TYPE: TFullSyncSettingType[] = [
  SYNC_FULL_SETTING_AUTO,
  SYNC_FULL_SETTING_THRESHOLD,
  SYNC_FULL_SETTING_RANGE,
  SYNC_FULL_SETTING_ROLLBACK,
];

export enum fullSyncSettingType {
  "自动同步程序设置" = SYNC_FULL_SETTING_AUTO,
  "风险操作阈值" = SYNC_FULL_SETTING_THRESHOLD,
  "同步范围" = SYNC_FULL_SETTING_RANGE,
  "回滚任务设置" = SYNC_FULL_SETTING_ROLLBACK,
  "默认设置" = SYNC_FULL_SETTING_DEFAULT,
}

export enum incrementSyncSettingType {
  "自动同步程序设置" = SYNC_INCREMENT_SETTING_AUTO,
  "同步频率" = SYNC_INCREMENT_SETTING_FREQUENCY,
  "默认设置" = SYNC_INCREMENT_SETTING_DEFAULT,
}

export enum syncTypeEnum {
  "自动推送" = AUTO_SYNC,
  "重试同步" = MANUAL_SYNC,
  "回滚同步" = ROLLBACK_SYNC,
  // 为了类型检查，增加一个类型
  "重试同步1" = ROLL_RETRY_SYNC,
}

export enum typeEnum {
  "用户同步" = TYPE_USER,
  "部门同步" = TYPE_DEPT,
  "关系同步" = TYPE_USER_DEPT,
}

export enum fullStatusEnum {
  "待同步" = FULL_SYNC_WAIT,
  "同步中" = FULL_SYNCING,
  "成功" = FULL_SYNC_SUCCESS,
  "异常" = FULL_SYNC_ERROR,
  "已取消" = FULL_SYNC_CANCEL,
  "警告" = FULL_SYNC_THRESHOLD_WARN,
  // 为了类型检查，增加一个类型
  "警告1" = FULL_SYNC_RANGE_WARN,
}

export enum incrementStatusEnum {
  "异常" = INCREMENT_SYNC_ERROR,
  "成功" = INCREMENT_SYNC_SUCCESS,
}

export enum updateTypeEnum {
  dept_del = "删除部门",
  dept_update = "修改部门",
  dept_add = "添加部门",
  dept_move = "移动部门",
  user_del = "删除用户",
  user_add = "添加用户",
  user_update = "修改用户",
  user_dept_add = "用户加入部门",
  user_dept_del = "用户移除部门",
  user_dept_update = "用户部门修改",
  user_dept_move = "用户移动部门",
}

export enum timeTypeEnum {
  "分钟" = TIME_MIN,
  "小时" = TIME_HOUR,
}

export const autoSyncStatus = {
  0: ZH_CN["sync_auto_status_stop"],
  1: ZH_CN["sync_auto_status_open"],
};

export const ACCOUNT_MIDDLE_TABLE_DATA = "accountMiddleTableData";
export const DEPT_SYNC_DATA = "deptSyncData";
export const USER_SYNC_DATA = "userSyncData";
export const USER_DEPT_RELATION_SYNC_DATA = "userDeptRelationSyncData";
export const ERROR_REASON_DATA = "errorReasonData";

// 分析面板类型
export const ANALYSE_TYPE = [
  // ACCOUNT_MIDDLE_TABLE_DATA,
  DEPT_SYNC_DATA,
  USER_SYNC_DATA,
  USER_DEPT_RELATION_SYNC_DATA,
  ERROR_REASON_DATA,
]

// 分析类型名称
export const analyseNameMap = new Map([
  [ACCOUNT_MIDDLE_TABLE_DATA, ZH_CN["account_middle_table_data"]],
  [DEPT_SYNC_DATA, ZH_CN["dept_sync_data"]],
  [USER_SYNC_DATA, ZH_CN["user_sync_data"]],
  [USER_DEPT_RELATION_SYNC_DATA, ZH_CN["user_dept_relation_sync_data"]],
  [ERROR_REASON_DATA, ZH_CN["error_reason_data"]],
])

export type TFullSyncStatusCode = (typeof fullStatusEnum)[keyof typeof fullStatusEnum];
export type TIncrementStatusCode = (typeof incrementStatusEnum)[keyof typeof incrementStatusEnum];
export type TSyncType = `${syncTypeEnum}`;
export type TIncrementSyncType = `${typeEnum}`;
export type TIncrementSyncUpdateType = keyof typeof updateTypeEnum;
export type TSettingTimeType = typeof SYNC_FULL | typeof SYNC_INCREMENT;
export type TFullSyncSettingType = `${fullSyncSettingType}`;
export type TIncrementSyncSettingType = `${incrementSyncSettingType}`;
