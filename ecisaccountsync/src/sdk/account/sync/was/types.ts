/* eslint-disable camelcase */
import { WPSUserStatus } from '../types'
import {ChangeUserDept, UpdateCompanyUser} from "../../../v7/org/dev/v1";

export enum WpsSource {
  SYNC = "sync",
  BUILDIN = "buildin"
}

export interface WPSUserOptionalProperties {
  source: WpsSource

  email?: string

  gender?: string
  telephone?: string
  mobile_phone?: string
  title?: string
  work_place?: string

  leader?: string
  employee_id?: string
  employment_type?: string

  avatar?: string,
  custom_fields?: [{
    field_id: string,
    relation_obj?: string,
    relation_objs?: string[],
    text?: string,
    url?: {
      link: string,
      title: string
    }
  }],

  abs_path?: string
}

export interface WPSUser extends WPSUserOptionalProperties {
  company_id: string
  user_id: string // user id
  login_name: string
  nick_name: string
  status: WPSUserStatus

  def_dept_id: string
  third_platform_id: string
  third_union_id: string

  ctime: number
}

export interface WPSMember extends WPSUser {
  order: number
}

export interface WPSDeptUser extends WPSUser {
  did: string
}

export interface WPSUserExtra {
  uid: string // user id
  ctime: number
  mtime: number

  extra?: object
  p1?: number
  p2?: number
  p3?: number
  p4?: string
  p5?: string
}

export interface WPSDepartment {
  company_id: string
  name: string
  order: number
  dept_id: string
  dept_pid: string
  third_platform_id?: string // 新增
  third_dept_id: string
  source: string
  abs_path: string
  id_path: string
  type?: string
  ctime: number
}

export interface DeptAndWeight {
  dept_id: string
  weight: number
}

export interface WPSDepartmentExtraProperties {
  third_dept_id: string
  extra?: object
  p1?: number
  p2?: string
}

export interface WPSDepartmentExtra {
  company_id: string
  dept_id: string // 类型修改
  platform_id: string
  third_dept_id: string
  ctime: number
  extra: object
  p1: number
  p2: string
}

export enum WPSTenantStatus {
  Normal = 1,
  Disabled = 2,
  Delete = 3
}

export interface WPSTenant {
  id: string
  code: string
  name: string
  // 1-正常 2-禁用 3-删除
  status: WPSTenantStatus
  ctime: bigint
  mtime: bigint
}

export interface DeptMemberOrder {
  user_id: string;
  dept_id: string;
  order: number;
}

export interface IWPSAccountService {
  root(companyId: string): Promise<WPSDepartment>

  getDepartment(companyId: string, id: string): Promise<WPSDepartment>

  getDepartmentsByParent(
    companyId: string,
    parentId: string,
    offset: number,
    limit: number
  ): Promise<WPSDepartment[]>
  queryDeptsByThirdUnionId(companyId: string, platform_id: string, union_ids: string[]): Promise<WPSDepartment[]>

  addDepartment(companyId: string, parentId: string, dept: WPSDepartment): Promise<string>

  updateDepartment(
    companyId: string,
    did: string,
    pid: string,
    name: string,
    order: number
  ): Promise<void>

  removeDepartment(companyId: string, did: string): Promise<void>

  removeDepartments(companyId: string, dids: string[]): Promise<void>

  moveDepartment(companyId: string, did: string, pid: string): Promise<void>

  addUser(
    companyId: string,
    loginName: string,
    password: string,
    name: string,
    platform_id: string,
    thirdUnionId: string,
    dept_id: string,
    order: number,
    properties: Partial<WPSUserOptionalProperties>
  ): Promise<WPSUser>

  updateUser(
    companyId: string,
    uid: string,
    update: UpdateCompanyUser
  ): Promise<void>

  enableUsers(companyId: string, uids: string[], enabled: boolean): Promise<void>
  activeUsers(companyId: string, uids: string[]): Promise<void>
  deleteUser(companyId: string, uid: string): Promise<void>
  deleteUsers(companyId: string, uids: string[]): Promise<void>

  getUser(companyId: string, uid: string, status: WPSUserStatus[]): Promise<WPSUser>
  getAllUsers(
    companyId: string,
    platform_id: string,
    status: WPSUserStatus[],
    offset: number,
    limit: number
  ): Promise<WPSUser[]>

  getUserByThirdUnionId(
      companyId: string,
      platform_id: string,
      thirdUnionId: string
  ): Promise<WPSUser>
  getUsersByThirdUnionIds(
      companyId: string,
      platform_id: string,
      thirdUnionIds: string[]
  ): Promise<WPSUser[]>

  getUsersByDepartment(
    companyId: string,
    did: string,
    offset: number,
    limit: number
  ): Promise<WPSMember[]>

  getDepartmentsByUser(
    companyId: string,
    uid: string
  ): Promise<WPSDepartment[]>

  bindUserToDepartment(
    companyId: string,
    dept: WPSDepartment,
    uid: string,
    order: number,
    set_def_dept: boolean
  ): Promise<void>

  removeUserFromDepartment(companyId: string, dept: WPSDepartment, uid: string): Promise<void>

  updateDepartmentMemberOrder(
      companyId: string,
      deptMember: DeptMemberOrder,
  ): Promise<void>

  changeAccountDept(companyId: string, change: ChangeUserDept): Promise<void>

  getTenantList(offset: number, limit: number): Promise<WPSTenant[]>

  getTenantByCode(thirdCompanyId: string): Promise<WPSTenant>

  createTenant(code: string, name: string): Promise<WPSTenant>

  initTenantAdmin(companyId: string, account: string, password: string): Promise<void>
}
