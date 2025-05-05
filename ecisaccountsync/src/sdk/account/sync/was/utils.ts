import {
  WPSDepartment,
  WPSMember, WpsSource,
  WPSTenant,
  WPSTenantStatus,
  WPSUser
} from './types'
import { WPSUserStatus } from '../types'
import {AccountInfo, AccountStatus, Department, Member, Tenant, TenantStatus} from "../../../v7/tenant";

export function convertDept(from: Department): WPSDepartment {
  return {
    company_id: from.company_id,
    name: from.name,
    order: from.weight,
    dept_id: from.id,
    dept_pid: from.parent_id,
    third_platform_id: from.third_platform_id,
    third_dept_id: from.third_union_id,
    source: from.source,
    abs_path: from.abs_path,
    id_path: from.id_path,
    type: from.type,
    ctime: from.ctime,
  } as WPSDepartment
}

export function convertDepts(froms: Department[]): WPSDepartment[] {
  const tos: WPSDepartment[] = []
  if (!froms) {
    return tos
  }
  for (const from of froms) {
    const to = convertDept(from)
    tos.push(to)
  }
  return tos
}

export function convertUserStatus(status: AccountStatus): WPSUserStatus {
  return status as string as WPSUserStatus
}

export function toAccountStatus(status: WPSUserStatus): AccountStatus {
  return status as string as AccountStatus
}

export function convertUser(from: AccountInfo): WPSUser {
  return {
    company_id: from.company_id,
    user_id: from.account_id,
    login_name: from.login_name,
    nick_name: from.nick_name,
    status: convertUserStatus(from.status),
    role: from.role,
    def_dept_id: from.def_dept_id,
    dept_num: from.dept_num,
    third_platform_id: from.third_platform_id,
    third_union_id: from.third_union_id,
    source: from.source,
    email: from.email,
    gender: from.gender,
    mobile_phone: from.mobile_phone,
    telephone: from.telephone,
    avatar: from.avatar,
    title: from.title,
    employee_id: from.employee_id,
    employment_type: from.employee_type,
    work_place: from.work_place,
    leader: from.leader,
    ctime: from.ctime,
  } as WPSUser
}

export function convertUsers(froms: AccountInfo[]): WPSUser[] {
  const tos: WPSUser[] = []
  if (!froms) {
    return tos
  }
  for (const from of froms) {
    const to = convertUser(from)
    tos.push(to)
  }
  return tos
}

export function convertMember(from: Member): WPSMember {
  return {
    company_id: from.company_id,
    user_id: from.account_id,
    login_name: from.account_info.login_name,
    nick_name: from.account_info.nick_name,
    status: convertUserStatus(from.status),

    def_dept_id: from.account_info.def_dept_id,
    third_platform_id: from.account_info.third_platform_id,
    third_union_id: from.account_info.third_union_id,

    source: from.account_info.source,
    email: from.account_info.email,
    gender: from.account_info.gender,
    phone: from.account_info.mobile_phone,
    telephone: from.account_info.telephone,
    ctime: from.account_info.ctime,
    order: from.weight,
  } as WPSMember
}

export function convertMembers(froms: Member[]): WPSMember[] {
  const tos: WPSMember[] = []
  if (!froms) {
    return tos
  }
  for (const from of froms) {
    const to = convertMember(from)
    tos.push(to)
  }
  return tos
}

export function convertTenantStatus(from: TenantStatus): WPSTenantStatus {
  return from as number as WPSTenantStatus
}

export function toTenantStatus(status: WPSTenantStatus): TenantStatus {
  return status as number as TenantStatus
}

export function convertTenant(from: Tenant): WPSTenant {
  if (!from) {
    return null
  }
  return {
    id: from.id,
    code: from.code,
    name: from.name,
    // 1-正常 2-禁用 3-删除
    status: from.status as number as WPSTenantStatus,
    ctime: from.ctime,
    mtime: from.mtime,
  }
}

export function convertTenants(froms: Tenant[]): WPSTenant[] {
  const tos: WPSTenant[] = []
  if (!froms) {
    return tos
  }
  for (const from of froms) {
    const to = convertTenant(from)
    tos.push(to)
  }
  return tos
}
