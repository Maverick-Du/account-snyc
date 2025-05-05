import { AdminOperationTypeEnum } from "../audit/type"
import { FullSyncUpdateType, IncrementStatus, IncrementUpdateType, SyncType } from "../db/types"

export interface IFullSyncTaskDetail {
  id: number
  task_id: string
  sync_type: SyncType
  status: number
  operator: string
  collect_cost: number
  begin_time: number
  end_time: number
  error_msg: string
  total_user: number
  sync_user: number
  total_dept: number
  sync_dept: number
  total_dept_user: number
  sync_dept_user: number
  dept_add: number
  dept_delete: number
  dept_update: number
  dept_move: number
  user_add: number
  user_delete: number
  user_update: number
  dept_user_add: number
  dept_user_delete: number
  dept_user_update: number
  dept_user_sort: number
}

export interface IFullSyncTaskListItem {
  id: number
  task_id: string
  company_id: string
  sync_type: SyncType
  status: number
  operator: string
  collect_cost: number
  begin_time: number
  end_time: number
  total_user: number
  sync_user: number
  total_dept: number
  sync_dept: number
  is_retry: boolean
  is_ignore: boolean
}

export interface IIncrementSyncDetail {
  id: number
  sync_type: SyncType
  update_type: IncrementUpdateType
  status: IncrementStatus
  operator: string
  msg: string
  mtime: number
  jsonData: any
}

export interface IIncrementSyncTimeDetail {
  open: number
  type: string
  rate: number
}

export enum IncrementSyncType {
  USER = 'user',
  DEPT = 'dept',
  USER_DEPT = 'user_dept'
}

export interface IncrementScheduleTime {
  startTime: number
  endTime: number
}

export interface IncrementScheduleTimeSQL {
  startTime: string
  endTime: string
}

export interface LogDetail {
  companyId: string
  operatorId: string
  operatorAccount: string
  operatorName: string
  operationTime: string
  operationType: AdminOperationTypeEnum
  operationName: string
  operationStatus: string
  ip: string
  deviceInfo: string
  detail: string
}

export interface ISuccessTaskSchedule {
  startTime: number
  endTime: number
}

export interface ISuccessTaskScheduleSQL {
  startTime: string
  endTime: string
}

export type IDownloadDetailSheetType = 'user' | 'dept' | 'deptUser'

export interface IDetailDownloadBaseSheetHeader {
  thirdId: string // 三方id
  deptPath: string // 部门路径
  result: string // 结果
  syncOperation: string // 同步操作
  errMsg: string // 失败原因
}

export interface IDetailDownloadUserSheetHeader extends IDetailDownloadBaseSheetHeader {
  userName: string // 姓名
  account: string // 账号
}

export interface IDetailDownloadDeptSheetHeader extends IDetailDownloadBaseSheetHeader {
  deptName: string // 部门名称
}

export interface IDetailDownloadUserDeptSheetHeader extends IDetailDownloadBaseSheetHeader {
  userName: string // 姓名
  account: string // 账号
}

export const DOWNLOAD_DETAIL_SHEET_HEADERS_MAP = new Map<IDownloadDetailSheetType, IDetailDownloadBaseSheetHeader>([
  [
    'user', {
      userName: '姓名',
      account: '账号',
      thirdId: '三方ID',
      deptPath: '部门路径',
      result: '结果',
      syncOperation: '同步操作',
      errMsg: '失败原因',
    } as IDetailDownloadUserDeptSheetHeader
  ],
  [
    'dept', {
      deptName: '部门',
      thirdId: '三方ID',
      deptPath: '部门路径',
      result: '结果',
      syncOperation: '同步操作',
      errMsg: '失败原因',
    } as IDetailDownloadDeptSheetHeader
  ],
  [
    'deptUser', {
      userName: '姓名',
      account: '账号',
      thirdId: '三方ID',
      deptPath: '部门路径',
      result: '结果',
      syncOperation: '同步操作',
      errMsg: '失败原因',
    } as IDetailDownloadUserDeptSheetHeader
  ]
])

export const DOWNLOAD_DETAIL_SHEET_NAMES_MAP = new Map<IDownloadDetailSheetType, string>([
  ['user', '同步用户记录'],
  ['dept', '同步部门记录'],
  ['deptUser', '关系同步记录'],
])

export const FULL_SYNC_UPDATE_TYPE_MAP = new Map<FullSyncUpdateType, string>([
  [FullSyncUpdateType.DeptAdd, '新增部门'],
  [FullSyncUpdateType.DeptDel, '删除部门'],
  [FullSyncUpdateType.DeptUpdate, '修改部门'],
  [FullSyncUpdateType.DeptMove, '移动部门'],
  [FullSyncUpdateType.UserAdd, '新增用户'],
  [FullSyncUpdateType.UserDel, '删除用户'],
  [FullSyncUpdateType.UserUpdate, '修改用户'],
  [FullSyncUpdateType.UserEnable, '启用用户'],
  [FullSyncUpdateType.UserDisable, '禁用用户'],
  [FullSyncUpdateType.UserDeptAdd, '用户加入部门'],
  [FullSyncUpdateType.UserDeptDel, '用户移除部门'],
  [FullSyncUpdateType.UserOrderUpdate, '修改用户部门排序'],
  [FullSyncUpdateType.MainDeptUpdate, '修改用户主部门'],
  [FullSyncUpdateType.UserOrderOrMainDeptUpdate, '修改用户部门排序或主部门'],
])

export interface IFailDetailDownloadSheetHeader extends IDetailDownloadBaseSheetHeader {
  type: string // 类型
  name: string // 名称
  account: string // 账号
}

export const FAIL_DOWNLOAD_DETAIL_SHEET_HEADER: IFailDetailDownloadSheetHeader = {
  type: '类型',
  name: '名称',
  account: '账号',
  thirdId: '三方ID',
  deptPath: '部门路径',
  result: '结果',
  syncOperation: '同步操作',
  errMsg: '失败原因',
}

export const FAIL_DOWNLOAD_DETAIL_TYPE_MAP = new Map<IDownloadDetailSheetType, string>([
  ['user', '用户同步'],
  ['dept', '部门同步'],
  ['deptUser', '用户关系同步']
])

export interface IWarnDetailDownloadSheetHeader extends IFailDetailDownloadSheetHeader {}

export const WARN_DOWNLOAD_DETAIL_SHEET_HEADER: IWarnDetailDownloadSheetHeader = {
  type: '类型',
  name: '名称',
  account: '账号',
  thirdId: '三方ID',
  deptPath: '部门路径',
  result: '结果',
  syncOperation: '同步操作',
  errMsg: '原因',
}

export const WARN_DOWNLOAD_DETAIL_TYPE_MAP = FAIL_DOWNLOAD_DETAIL_TYPE_MAP
