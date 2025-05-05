import { WPSUserStatus } from '../types'
import { FullSyncTaskStatistics } from "../engine";
import { WPSDepartment } from "../was";
import { WpsOpenDepartment } from "../../../v7/org/open/v1";
import { UserSchema } from './tables';

export interface LocalUserOptionalProperties {
  password?: string
  role?: string
  avatar?: string
  email?: string
  gender?: string
  title?: string
  work_place?: string
  leader?: string
  phone?: string
  telephone?: string

  employer?: string
  employment_status?: string
  employment_type?: string
  source?: string

  custom_fields?: any[]
}

export interface LocalUser extends LocalUserOptionalProperties {
  uid: string
  task_id: string
  third_company_id: string
  company_id?: string
  platform_id: string
  name: string
  nick_name: string
  def_did?: string,
  def_did_order?: number

  ctime: number
  mtime: number
}

export interface LocalDepartment {
  did: string
  task_id: string
  third_company_id: string
  platform_id: string
  pid: string
  name: string
  order: number
  source?: string
  type?: string
  ctime?: number
  mtime?: number
  leaders?: DeptLeader[]
  check_type?: CheckTypeEnum
}

export interface DeptLeader {
  uid: string,
  order: number
  user_id?: string
}

export interface LocalMember extends LocalUser {
  main: number
  order: number
}

export interface WpsDeptAndLocalMember {
  dept: WPSDepartment
  user: LocalMember
}

export interface LocalDeptAndWpsDept {
  localDept: LocalDepartment
  wpsDept: WpsOpenDepartment
}

export interface LocalDeptUser {
  task_id: string
  third_company_id: string
  platform_id: string
  did: string
  uid: string
  order: number
  main: number
  leader: number
}

export enum LocalMemberMainEnum {
  TRUE = 1,
  FALSE = 0
}

export interface LocalCountData {
  deptCount: number,
  userCount: number,
  deptUserCount: number
}

export enum CheckTypeEnum {
  ENABLE = 1,
  DISABLE = 0
}

export const DEFAULT_ROOT_DEPT_ID = '0'

export const DEFAULT_ROOT_DEPT_P_ID = '-1'

export const DEFAULT_ROOT_PLATFORM_ID = '-1'

export const DEFAULT_USER_STATUS = WPSUserStatus.NotActive

export interface ILocalAccountService {
  root(taskId: string, thirdCompanyId: string): Promise<LocalDepartment>

  getDepartment(taskId: string, thirdCompanyId: string, platform_id: string, distId: string): Promise<LocalDepartment>
  getDepartments(taskId: string, thirdCompanyId: string, platform_id: string, distIds: string[]): Promise<LocalDepartment[]>
  listDepartments(
    taskId: string,
    thirdCompanyId: string,
    platform_id: string,
    pid: string,
    offset: number,
    limit: number
  ): Promise<LocalDepartment[]>

  getAllDeptUserList(taskId: string, thirdCompanyId: string, platformId: string): Promise<LocalDeptUser[]>

  pageQueryDeptUsers(taskId: string, thirdCompanyId: string, platformId: string, startId: number, endId: number): Promise<LocalDeptUser[]>

  pageQueryDepts(taskId: string, thirdCompanyId: string, platformId: string, startId: number, endId: number): Promise<LocalDepartment[]>

  getDeptUerMinOrMaxId(taskId: string, thirdCompanyId: string, platformId: string, order: string): Promise<number>

  getDeptMinOrMaxId(taskId: string, thirdCompanyId: string, platformId: string, order: string): Promise<number>

  // getAllUsers1(taskId: string, thirdCompanyId: string, platform_id: string, offset:number, limit:number): Promise<LocalUser[]>
  // getUser(taskId: string, platform_id: string, uid: string): Promise<LocalUser>
  getAllUsers(taskId: string, thirdCompanyId: string, platformId: string, startIndex: number, endIndex: number): Promise<LocalUser[]>

  getAllUsersNoCustom(taskId: string, thirdCompanyId: string, platformId: string, startIndex: number, endIndex: number): Promise<LocalUser[]>

  getTaskMinOrMaxId(taskId: string, thirdCompanyId: string, isMin: boolean): Promise<number>

  getUsersByUids(taskId: string, platformId: string, uids: string[]): Promise<LocalUser[]>

  getUsersByDepartment(
    taskId: string,
    thirdCompanyId: string,
    platform_id: string,
    deptId: string,
    offset: number,
    limit: number
  ): Promise<LocalMember[]>

  // getUserMainDept(taskId: string, platform_id: string, userId: string): Promise<LocalDeptUser>

  getDeptUids(taskId: string, thirdCompanyId: string, platformId: string, did: string): Promise<string[]>
  getNoDeptUids(taskId: string, thirdCompanyId: string, platformId: string): Promise<string[]>
  cancelDeptCheck(taskId: string, thirdCompanyId: string, platformId: string, did: string): Promise<void>
  cancelUserCheck(taskId: string, thirdCompanyId: string, platformId: string, uids: string[]): Promise<void>
  cancelDeptUserCheck(taskId: string, thirdCompanyId: string, platformId: string, did: string): Promise<void>

  checkDept(taskId: string, thirdCompanyId: string, platformId: string, did: string): Promise<void>
  checkUsers(taskId: string, thirdCompanyId: string, platformId: string, uids: string[]): Promise<void>
  checkDeptUser(taskId: string, thirdCompanyId: string, platformId: string, did: string): Promise<void>

  // resetCheckType(taskId: string, thirdCompanyId: string, platformIds: string[], enable: boolean): Promise<void>

  pageResetDeptCheckType(startId: number, endId: number, enable: boolean): Promise<void>
  pageResetUserCheckType(startId: number, endId: number, enable: boolean): Promise<void>
  pageResetDeptUserCheckType(startId: number, endId: number, enable: boolean): Promise<void>

  deleteDeptsAndUsersByTaskId(taskId: string): Promise<void>

  getDistinctTaskId(): Promise<string[]>

  statisticsLasData(taskId: string, thirdCompanyId: string): Promise<FullSyncTaskStatistics>

  countLasData(): Promise<LocalCountData>

  getDepartmentNoCheck(taskId: string, thirdCompanyId: string, platform_id: string, distId: string): Promise<LocalDepartment>
  getDepartmentsNoCheck(taskId: string, thirdCompanyId: string, platform_id: string, distIds: string[]): Promise<LocalDepartment[]>
  listDepartmentsNoCheck(
    taskId: string,
    thirdCompanyId: string,
    platform_id: string,
    pid: string,
    offset: number,
    limit: number
  ): Promise<LocalDepartment[]>

  countLasTaskData(taskId: string, thirdCompanyId: string): Promise<LocalCountData>

  pageQueryDeptUsersByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number): Promise<LocalDeptUser[]>
  pageQueryDeptsByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number): Promise<LocalDepartment[]>
  pageQueryUsersByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number): Promise<UserSchema[]>

}

export interface CompanyCfg {
  // 三方租户编码
  thirdCompanyId: string
  // 云文档租户id
  companyId: string
  // 该租户对应的数据源list，可能有多个
  platformIdList: string[]
}
