import { IncrementSyncType } from "../admin/type"
import { IncrementUpdateType } from "../db/types"
import {format} from 'date-fns'

export enum BaseOpTypeEnum {
  LOGIN_OP = 'login_op',
  ADMIN_OP = 'admin_op',
  DOCUMENT_OP = 'document_op',
  GROUP_OP = 'group_op'
}



export interface LogType {
  success: boolean
  detail: string
  opKey: string
  opTime: number
  deviceInfo: string
  companyId: string
  userId: string
  ip: string
}

export enum OperationTypeSort {
  first = 'first',
  second = 'second'
}

export const ROOT_OPERATION_KEY = BaseOpTypeEnum.ADMIN_OP as string

export enum AdminOperationTypeEnum {
  ACCOUNT_SYNC_OPERATION = 'account_sync_operation',
  ACCOUNT_SYNC_CONFIG = 'account_sync_config',
  CANCEL_FULL_SYNC_TASK = 'cancel_full_sync_task',
  STOP_FULL_SYNC_TASK = 'stop_full_sync_task',
  RETRY_FULL_SYNC_TASK = 'retry_full_sync_task',
  IGNORE_FULL_SYNC_TASK = 'ignore_full_sync_task',
  CONTINUE_FULL_SYNC_TASK = 'continue_full_sync_task',
  ROLLBACK_FULL_SYNC_TASK = 'rollback_full_sync_task',
  DOWNLOAD_FULL_SYNC_DETAIL = 'download_full_sync_detail',
  RETRY_INCREMENT_SYNC_TASK = 'retry_increment_sync_task',
  FULL_SYNC_AUTO_CONFIG = 'full_sync_auto_config',
  INCREMENT_SYNC_AUTO_CONFIG = 'increment_sync_auto_config',
  INCREMENT_SYNC_RATE_CONFIG = 'increment_sync_rate_config',
  FULL_SYNC_SCOPE_SET = 'full_sync_scope_set',
  FULL_SYNC_THRESHOLD_SET = 'full_sync_threshold_set',
}


export interface OperationTypeDetail {
  opName: string
  opKey: AdminOperationTypeEnum
  pOpKey: string
  opType: OperationTypeSort
  detailCallback?: Function
}

export interface AuditIncrementRetryData {
  uid: string
  uName: string
  did: string
  dName: string
}

export const INCREMENT_UPDATE_TYPE_MAP = new Map<IncrementUpdateType, string>([
  [IncrementUpdateType.DeptAdd, '添加部门'],
  [IncrementUpdateType.DeptDel, '删除部门'],
  [IncrementUpdateType.DeptMove, '移动部门'],
  [IncrementUpdateType.DeptUpdate, '更新部门'],
  [IncrementUpdateType.UserAdd, '添加用户'],
  [IncrementUpdateType.UserDel, '删除用户'],
  [IncrementUpdateType.UserUpdate, '更新用户'],
  [IncrementUpdateType.UserDeptAdd, '部门添加用户'],
  [IncrementUpdateType.UserDeptDel, '部门删除用户'],
  [IncrementUpdateType.UserDeptMove, '用户移动部门'],
  [IncrementUpdateType.UserDeptUpdate, '更新用户部门']
])

export const OPERATION_MAP = new Map<AdminOperationTypeEnum, OperationTypeDetail>([
  [
    AdminOperationTypeEnum.ACCOUNT_SYNC_OPERATION, {
      opName: '三方账号同步-同步操作',
      opKey: AdminOperationTypeEnum.ACCOUNT_SYNC_OPERATION,
      pOpKey: ROOT_OPERATION_KEY,
      opType: OperationTypeSort.first
    }
  ],
  [
    AdminOperationTypeEnum.ACCOUNT_SYNC_CONFIG, {
      opName: '三方账号同步-同步配置',
      opKey: AdminOperationTypeEnum.ACCOUNT_SYNC_CONFIG,
      pOpKey: ROOT_OPERATION_KEY,
      opType: OperationTypeSort.first
    }
  ],
  [
    AdminOperationTypeEnum.CANCEL_FULL_SYNC_TASK, {
      opName: '全量同步-取消同步',
      opKey: AdminOperationTypeEnum.CANCEL_FULL_SYNC_TASK,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_OPERATION,
      opType: OperationTypeSort.second,
      detailCallback: (taskId: string, success: boolean) => {
        let operationDesc = success ? '操作成功' : '操作失败'
        return `取消【${taskId}】全量任务同步，${operationDesc}`
      }
    }
  ],
  [
    AdminOperationTypeEnum.STOP_FULL_SYNC_TASK, {
      opName: '全量同步-终止任务',
      opKey: AdminOperationTypeEnum.STOP_FULL_SYNC_TASK,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_OPERATION,
      opType: OperationTypeSort.second,
      detailCallback: (taskId: string, success: boolean) => {
        let operationDesc = success ? '操作成功' : '操作失败'
        return `终止【${taskId}】全量任务同步，${operationDesc}`
      }
    }
  ],
  [
    AdminOperationTypeEnum.RETRY_FULL_SYNC_TASK, {
      opName: '全量同步-手动重试',
      opKey: AdminOperationTypeEnum.RETRY_FULL_SYNC_TASK,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_OPERATION,
      opType: OperationTypeSort.second,
      detailCallback: (taskId: string, retryTime: number, success: boolean) => {
        let newRetryTime = Number(retryTime)
        let operationDesc = success ? '操作成功' : '操作失败'
        if (newRetryTime < Date.now()) {
          return `手动重试【${taskId}】全量任务，立即执行，${operationDesc}`
        }
        return `手动重试【${taskId}】全量任务，选择时间${format(new Date(newRetryTime), 'yyyy-MM-dd HH:mm:ss')}时间执行，${operationDesc}`
      }
    }
  ],
  [
    AdminOperationTypeEnum.IGNORE_FULL_SYNC_TASK, {
      opName: '全量同步-忽略异常',
      opKey: AdminOperationTypeEnum.IGNORE_FULL_SYNC_TASK,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_OPERATION,
      opType: OperationTypeSort.second,
      detailCallback: (taskId: string, success: boolean) => {
        let operationDesc = success ? '操作成功' : '操作失败'
        return `忽略【${taskId}】全量异常任务，${operationDesc}`
      }
    }
  ],
  [
    AdminOperationTypeEnum.CONTINUE_FULL_SYNC_TASK, {
      opName: '全量同步-继续同步',
      opKey: AdminOperationTypeEnum.CONTINUE_FULL_SYNC_TASK,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_OPERATION,
      opType: OperationTypeSort.second,
      detailCallback: (taskId: string, success: boolean) => {
        let operationDesc = success? '操作成功' : '操作失败'
        return `继续同步【${taskId}】全量任务，选择时间${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}执行，${operationDesc}`
      }
    }
  ],
  [
    AdminOperationTypeEnum.DOWNLOAD_FULL_SYNC_DETAIL, {
      opName: '全量同步-下载详情',
      opKey: AdminOperationTypeEnum.DOWNLOAD_FULL_SYNC_DETAIL,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_OPERATION,
      opType: OperationTypeSort.second,
      detailCallback: (taskId: string, type: 'normal' | 'abnormal' | 'warn', success: boolean) => {
        let operationDesc = success ? '操作成功' : '操作失败'
        if (type === 'normal') {
          return `下载【${taskId}】全量任务详情，${operationDesc}`
        } else if (type === 'abnormal') {
          return `下载【${taskId}】全量任务异常数据详情，${operationDesc}`
        } else if (type === 'warn') {
          return `下载【${taskId}】全量任务警告数据详情，${operationDesc}`
        }
      }
    }
  ],
  [
    AdminOperationTypeEnum.RETRY_INCREMENT_SYNC_TASK, {
      opName: '增量同步-手动重试',
      opKey: AdminOperationTypeEnum.RETRY_INCREMENT_SYNC_TASK,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_OPERATION,
      opType: OperationTypeSort.second,
      detailCallback: (auditLogData: AuditIncrementRetryData, opType: IncrementUpdateType, type: IncrementSyncType, success: boolean) => {
        let operationDesc = success ? '操作成功' : '操作失败'
        let operationType = INCREMENT_UPDATE_TYPE_MAP.get(opType) || ''
        if (type === IncrementSyncType.DEPT) {
          return `手动重试【${auditLogData.dName}（${auditLogData.did}）】【${operationType}】，${operationDesc}`
        } else if (type === IncrementSyncType.USER) {
          return `手动重试【${auditLogData.uName}（${auditLogData.uid}）】【${operationType}】，${operationDesc}`
        } else if (type === IncrementSyncType.USER_DEPT) {
          return `手动重试【${auditLogData.uid} -> ${auditLogData.did}】【${operationType}】，${operationDesc}`
        } else {
          return ''
        }
      }
    }
  ],
  [
    AdminOperationTypeEnum.FULL_SYNC_AUTO_CONFIG, {
      opName: '全量同步-自动同步配置',
      opKey: AdminOperationTypeEnum.FULL_SYNC_AUTO_CONFIG,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_CONFIG,
      opType: OperationTypeSort.second,
      detailCallback: (open: boolean, success: boolean) => {
        let operationDesc = success ? '操作成功' : '操作失败'
        if (open) {
          return `开启 全量同步-自动同步，${operationDesc}`
        }
        return `暂停 全量同步-自动同步，${operationDesc}`
      }
    }
  ],
  [
    AdminOperationTypeEnum.INCREMENT_SYNC_AUTO_CONFIG, {
      opName: '增量同步-自动同步配置',
      opKey: AdminOperationTypeEnum.INCREMENT_SYNC_AUTO_CONFIG,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_CONFIG,
      opType: OperationTypeSort.second,
      detailCallback: (open: boolean, success: boolean) => {
        let operationDesc = success ? '操作成功' : '操作失败'
        if (open) {
          return `开启 增量同步-自动同步，${operationDesc}`
        }
        return `暂停 增量同步-自动同步，${operationDesc}`
      }
    }
  ],
  [
    AdminOperationTypeEnum.INCREMENT_SYNC_RATE_CONFIG, {
      opName: '增量同步-同步频率配置',
      opKey: AdminOperationTypeEnum.INCREMENT_SYNC_RATE_CONFIG,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_CONFIG,
      opType: OperationTypeSort.second,
      detailCallback: (time: number, type: 'hour' | 'min', success: boolean) => {
        let operationDesc = success ? '操作成功' : '操作失败'
        let typeString = type === 'hour' ? '小时' : '分钟'
        return `设置频率，间隔${time}${typeString}同步，${operationDesc}`
      }
    }
  ],
  [
    AdminOperationTypeEnum.ROLLBACK_FULL_SYNC_TASK, {
      opName: '全量同步-回滚任务',
      opKey: AdminOperationTypeEnum.ROLLBACK_FULL_SYNC_TASK,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_CONFIG,
      opType: OperationTypeSort.second,
      detailCallback: (taskId: string, success: boolean, operator: string) => {
        let operationDesc = success? '操作成功' : '操作失败'
        if (success) {
          return `${operator}在${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}创建回滚任务${taskId}，${operationDesc}`
        }
        return `${operator}在${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}选择${taskId}创建回滚任务，${operationDesc}`
      } 
    }
  ],
  [
    AdminOperationTypeEnum.FULL_SYNC_SCOPE_SET, {
      opName: '全量同步-同步范围设置',
      opKey: AdminOperationTypeEnum.FULL_SYNC_SCOPE_SET,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_CONFIG,
      opType: OperationTypeSort.second,
      detailCallback: (deptNameCount: number, success: boolean, operator: string) => {
        let operationDesc = success? '操作成功' : '操作失败'
        return `${operator}勾选${deptNameCount}个部门，${operationDesc}`
      } 
    }
  ],
  [
    AdminOperationTypeEnum.FULL_SYNC_THRESHOLD_SET, {
      opName: '全量同步-风险阈值配置',
      opKey: AdminOperationTypeEnum.FULL_SYNC_THRESHOLD_SET,
      pOpKey: AdminOperationTypeEnum.ACCOUNT_SYNC_CONFIG,
      opType: OperationTypeSort.second,
      detailCallback: (userDel: number, deptDel: number, deptUserDel: number, success: boolean) => {
        let operationDesc = success? '操作成功' : '操作失败'
        return `批量删除用户阈值配置为【${userDel}】，批量删除部门阈值配置为【${deptDel}】，批量用户移除部门阈值配置为【${deptUserDel}】，${operationDesc}`
      } 
    }
  ]
])