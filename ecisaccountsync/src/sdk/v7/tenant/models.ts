import {WpsSource} from "../../account";

export enum AccountStatus {
  Active = 'active',
  NotActive = 'notactive',
  Disabled = 'disabled'
}

export interface AccountInfo {
  account_id: string
  company_id: string
  company_uid: string

  source: WpsSource
  login_name: string
  nick_name: string
  def_dept_id: string
  dept_num: number
  third_platform_id: string
  third_union_id: string
  role: string
  email: string
  gender: string
  mobile_phone: string
  status: AccountStatus
  avatar: string
  telephone: string
  title: string
  employee_id: string
  employee_type: string
  work_place: string
  leader: string
  ctime: number
}

export enum TenantStatus {
  Normal = 1,
  Disabled = 2,
  Delete = 3
}

export interface Tenant {
  id: string
  code: string
  name: string
  // 1-正常 2-禁用 3-删除
  status: TenantStatus
  ctime: bigint
  mtime: bigint
}

export interface Department {
  company_id: string
  id: string
  parent_id: string
  name: string
  alias: string
  third_platform_id: string
  third_union_id: string
  weight: number
  abs_path: string
  id_path: string
  leader_id: string
  source: string
  type?: string
  ctime: number
}

export interface Member{
  company_id: string
  account_id: string
  company_uid: string
  status: AccountStatus
  weight: number

  account_info: AccountInfo
}

