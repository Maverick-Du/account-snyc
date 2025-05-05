/* eslint-disable camelcase */

import {
  DeptMemberOrder,
  IWPSAccountService,
  WPSDepartment,
  WPSMember,
  WPSTenant,
  WPSUser,
  WPSUserOptionalProperties
} from './types'

import { convertDept, convertDepts, convertMembers, convertTenant, convertTenants, convertUser, convertUsers } from './utils'
import { WPSUserStatus } from '../types'
import {ChangeUserDept, CompaniesService, CompanyDept, CompanyUser, UpdateCompanyUser} from "../../../v7/org/dev/v1";
import {WPS4Context} from "../../../common/wps4";
import {TenantsService} from "../../../v7/tenant/dev";
import {AccountStatus} from "../../../v7/tenant";
import config from "../../../../common/config";
import {IDatabase} from "../../../cognac/orm";

export class V7AccountService implements IWPSAccountService {
  private db: IDatabase
  private ctx: WPS4Context
  private companies: CompaniesService
  private tenants: TenantsService

  constructor(ctx: WPS4Context, db: IDatabase) {
    this.ctx = ctx
    this.db = db
    this.companies = new CompaniesService(ctx)
    this.tenants = new TenantsService(ctx)
  }

  rootDeptMap : Map<string, WPSDepartment> = new Map<string, WPSDepartment>()

  async root(companyId: string): Promise<WPSDepartment> {
    if (this.rootDeptMap.has(companyId)) {
      return this.rootDeptMap.get(companyId)
    }
    const ret = await this.companies.root(companyId)
    const dept = convertDept(ret.data)
    this.rootDeptMap.set(companyId, dept)
    return dept
  }

  async getDepartment(companyId: string, id: string): Promise<WPSDepartment> {
    const ret = await this.companies.getDept(companyId, id)
    return convertDept(ret.data)
  }

  async getDepartmentsByParent(companyId: string, parentId: string, offset: number, limit: number): Promise<WPSDepartment[]> {
    return this.pageIt(limit, offset, async (l, o) => {
      const ret = await this.companies.getChildDepts(companyId, parentId, o, l)
      return convertDepts(ret.data.depts)
    })
  }

  async queryDeptsByThirdUnionId(companyId: string, platform_id: string, union_ids: string[]): Promise<WPSDepartment[]> {
    const ret = await this.companies.getDeptsByThirdUnionIds(companyId, platform_id, union_ids)
    return convertDepts(ret.data.depts)
  }

  async addDepartment(companyId: string, parentId: string, dept: WPSDepartment): Promise<string> {
    const d = {
      third_platform_id: dept.third_platform_id,
      third_union_id: dept.third_dept_id,
      name: dept.name,
      weight: dept.order,
      source: dept.source ? dept.source : 'sync'
    } as CompanyDept
    if (dept.type) d.type = dept.type
    const res = await this.companies.createChildDept(companyId, parentId, d)
    const _dept = convertDept(res.data)
    return _dept.dept_id
  }

  async updateDepartment(companyId: string, did: string, pid: string, name: string, order: number): Promise<void> {
    if (name || order) {
      await this.companies.updateDept(companyId, did, name, order)
    }

    // todo: just do change info, not move
    if (pid) {
      await this.companies.moveDept(companyId, did, pid)
    }
  }

  async removeDepartment(companyId: string, did: string): Promise<void> {
    await this.companies.delDept(companyId, did)
  }

  async removeDepartments(companyId: string, dids: string[]): Promise<void> {
    await this.companies.batchDelDept(companyId, dids)
  }

  async moveDepartment(companyId: string, did: string, pid: string): Promise<void> {
    await this.companies.moveDept(companyId, did, pid)
  }

  async addUser(
    companyId: string,
    loginName: string,
    password: string,
    name: string,
    platform_id: string,
    thirdUnionId: string,
    dept_id: string,
    order: number,
    properties: Partial<WPSUserOptionalProperties>): Promise<WPSUser> {
    const user = {
      account: loginName,
      avatar: properties.avatar,
      custom_fields: properties.custom_fields,
      def_dept_id: dept_id,
      dept_ids: [
        {
          dept_id: dept_id,
          weight: order,
        }
      ],
      email: properties.email,
      employee_id: properties.employee_id,
      employment_type: properties.employment_type,

      gender: properties.gender,
      leader:  properties.leader,
      mobile_phone: properties.mobile_phone,
      nick_name: name,
      password: password,
      source: properties.source,
      telephone: properties.telephone,

      third_platform_id: platform_id,
      third_union_id: thirdUnionId,

      title: properties.title,
      work_place: properties.work_place,
    }
    const ret = await this.companies.createMember(companyId, user as CompanyUser)
    return convertUser(ret.data)
  }

  async updateUser(companyId: string, uid: string, update: UpdateCompanyUser): Promise<void> {
    await this.companies.updateMember(companyId, uid, update)
  }

  async enableUsers(companyId: string, uids: string[], enabled: boolean): Promise<void> {
    if (enabled) {
      const res = await this.companies.batchEnableMembers(companyId, uids)
    } else {
      const res = await this.companies.batchDisableMembers(companyId, uids)
    }
  }

  async activeUsers(companyId: string, uids: string[]): Promise<void> {
    await this.enableUsers(companyId, uids, true)
  }

  async deleteUser(companyId: string, uid: string): Promise<void> {
    const res = await this.companies.batchDeleteMembers(companyId, [uid])
  }

  async deleteUsers(companyId: string, uids: string[]): Promise<void> {
    await this.companies.batchDeleteMembers(companyId, uids)
  }

  async getUser(companyId: string, uid: string): Promise<WPSUser> {
    const ret = await this.companies.getMember(companyId, uid)
    const user = convertUser(ret.data)
    if (user && (user.status === WPSUserStatus.NotActive || user.status === WPSUserStatus.Active)) {
      return user
    }
    return null
  }

  async getAllUsers(companyId: string, platform_id: string, status: WPSUserStatus[], offset: number, limit: number): Promise<WPSUser[]> {
    const aStatus = status.map(x => x as string as AccountStatus)
    return this.pageIt(limit, offset, async (l, o) => {
      const ret = await this.companies.getMembers(companyId, platform_id, aStatus, o, l)
      return convertUsers(ret.data.company_members)
    })
  }

  async getUserByThirdUnionId(companyId: string, platform_id: string, thirdUnionId: string): Promise<WPSUser> {
    const res = await this.companies.getThirdUsersByThirdUnionIds(companyId, platform_id, [thirdUnionId])
    const users = convertUsers(res.data.company_members)
    return users.length > 0 ? users[0] : null
  }

  async getUsersByThirdUnionIds(companyId: string, platform_id: string, thirdUnionIds: string[]): Promise<WPSUser[]> {
    const allUsers: any[] = []
    await this.groupOpt(thirdUnionIds, async(g) => {
      const res = await this.companies.getThirdUsersByThirdUnionIds(companyId, platform_id, g)
      const users = convertUsers(res.data.company_members)
      allUsers.push(...users)
    })
    return allUsers
  }

  async getUsersByDepartment(companyId: string, did: string, offset: number, limit: number): Promise<WPSMember[]> {
    const status = [AccountStatus.NotActive, AccountStatus.Active, AccountStatus.Disabled]
    return this.pageIt(limit, offset, async (l, o) => {
      const res = await this.companies.getDeptMembers(companyId, did, o, l, status)
      return convertMembers(res.data.dept_members)
    })
  }

  async getDepartmentsByUser(companyId: string, uid: string): Promise<WPSDepartment[]> {
    const res = await this.companies.getMemberDepts(companyId, uid)
    return convertDepts(res.data.depts)
  }

  async bindUserToDepartment(companyId: string, dept: WPSDepartment, uid: string, order: number, set_def_dept: boolean): Promise<void> {
    await this.companies.addMemberToDept(companyId, uid, dept.dept_id, order, set_def_dept)
  }

  async removeUserFromDepartment(companyId: string, dept: WPSDepartment, uid: string): Promise<void> {
    await this.companies.deleteMemberFromDept(companyId, uid, dept.dept_id)
  }

  async updateDepartmentMemberOrder(companyId: string, deptMember: DeptMemberOrder): Promise<void> {
    await this.companies.updateDeptMemberSort(companyId, deptMember.dept_id, deptMember.user_id, deptMember.order)
  }

  async changeAccountDept(companyId: string, change: ChangeUserDept) {
    await this.companies.changeAccountDept(companyId, change)
  }

  async getTenantList(offset: number, limit: number): Promise<WPSTenant[]> {
    return this.pageIt(limit, offset, async (l, o) => {
      const res = await this.tenants.getTenantList(o, l)
      return convertTenants(res.data.tenants)
    })
  }

  async getTenantByCode(thirdCompanyId: string): Promise<WPSTenant> {
    const res = await this.tenants.getTenantByCode(thirdCompanyId)
    return convertTenant(res.data)
  }

  async createTenant(code: string, name: string): Promise<WPSTenant> {
    const ret = await this.tenants.createTenant(code, name)
    return convertTenant(ret.data)
  }

  async initTenantAdmin(companyId: string, account: string, password: string): Promise<void> {
    await this.tenants.initTenantAdmin(companyId, account, password)
  }

  private async pageIt<T>(
    limit: number,
    offset: number,
    func: { (l: number, o: number): Promise<T[]> }
  ) {
    const start = offset
    const end = limit > 0 ? offset + limit : -1
    let items: T[] = []
    for (let i = start; i < end || end === -1; i += config.pageSize) {
      const l = end > 0 ? (end - i < config.pageSize ? end - i : config.pageSize) : config.pageSize
      const ret = await func(l, i)
      if (ret.length === 0) break
      items = items.concat(ret)
    }
    return items
  }

  // 分批操作
  async groupOpt<T>(
    data: T[],
    func: { (objectGroup: T[]): Promise<void> },
    groupSize: number = config.groupSize
  ) {
    const groupList = this.averageList(data, groupSize)
    for (const objectGroup of groupList) {
      await func(objectGroup)
    }
  }

  averageList<T>(list: T[], groupSize: number = config.groupSize): T[][] {
    const groupList: T[][] = []
    let start = 0
    let end = 0

    while (start < list.length) {
      end = start + groupSize
      if (end > list.length) {
        end = list.length
      }

      const objectGroup = list.slice(start, end)
      groupList.push(objectGroup)
      start = end
    }
    return groupList
  }
}
