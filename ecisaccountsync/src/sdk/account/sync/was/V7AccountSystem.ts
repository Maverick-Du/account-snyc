/* eslint-disable camelcase */
import { WPSUserStatus } from '../types'
import {
  IWPSAccountService,
  WPSDepartment, WPSMember,
  WPSUser, WPSTenant,
  WPSUserOptionalProperties,
  DeptMemberOrder
} from './types'
import {WPS4Context} from "../../../common/wps4";
import {V7AccountService} from "./V7AccountService";
import {ChangeUserDept, UpdateCompanyUser} from "../../../v7/org/dev/v1";
import {IDatabase} from "../../../cognac/orm";

export class V7AccountSystem {
  private service: IWPSAccountService

  constructor(wps4Ctx: WPS4Context, db: IDatabase) {
    this.service = new V7AccountService(wps4Ctx, db)
  }

  async root(companyId: string): Promise<WPSDepartment> {
    return this.service.root(companyId)
  }

  async getUserByLocal(
    companyId: string,
    platform_id: string,
    union_id: string,
    status: WPSUserStatus[] = [
      WPSUserStatus.Active,
      WPSUserStatus.NotActive,
      WPSUserStatus.Disabled
    ]
  ): Promise<WPSUser> {
    const res = await this.service.getUserByThirdUnionId(companyId, platform_id, union_id)
    if (res && status.indexOf(res.status) > -1) {
      return res
    }
    return null
  }

  async getUsersByLocal(
    companyId: string,
    platform_id: string,
    union_ids: string[],
    status:WPSUserStatus[] = [
      WPSUserStatus.Active,
      WPSUserStatus.NotActive,
      WPSUserStatus.Disabled]
  ): Promise<WPSUser[]> {
    const res: WPSUser[] = await this.service.getUsersByThirdUnionIds(companyId, platform_id, union_ids)
    const arr = []
    for (const re of res) {
      if (re && status.indexOf(re.status) > -1) {
        arr.push(re)
      }
    }
    return arr
  }

  async getAllUsers(
    companyId: string,
    platform_id: string,
    status: WPSUserStatus[],
    offset: number = 0,
    limit: number = -1
  ): Promise<WPSUser[]> {
    return this.service.getAllUsers(companyId, platform_id, status, offset, limit)
  }

  async deleteUser(companyId: string, user: WPSUser) {
    await this.service.deleteUser(companyId, user.user_id)
  }

  async deleteUsers(companyId: string, users: WPSUser[]) {
    await this.service.deleteUsers(companyId, users.map(x => x.user_id))
  }

  async enableUsers(companyId: string, users: WPSUser[], enabled: boolean): Promise<void> {
    // 1. 删除用户，软删除，不会退出部门
    await this.service.enableUsers(companyId, users.map(e => e.user_id), enabled)
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
    properties: Partial<WPSUserOptionalProperties> = {}
  ): Promise<WPSUser> {
    return this.service.addUser(
      companyId,
      loginName,
      password,
      name,
      platform_id,
      thirdUnionId,
      dept_id,
      order || 0,
      properties
    )
  }

  async updateUser(
    companyId: string,
    uid: string,
    update: UpdateCompanyUser
  ) {
    await this.service.updateUser(companyId, uid, update)
  }

  async listUsersByDepartment(
    companyId: string,
    dept: WPSDepartment,
    offset: number = 0,
    limit: number = -1
  ): Promise<WPSMember[]> {
    return this.service.getUsersByDepartment(companyId, dept.dept_id, offset, limit)
  }

  async listDepartmentsByUser(
    companyId: string,
    user: WPSUser
  ): Promise<WPSDepartment[]> {
    return this.service.getDepartmentsByUser(companyId, user.user_id)
  }

  async addUserToDepartment(companyId: string, dept: WPSDepartment, uid: string, order?:number, set_def_dept?: boolean) {
    await this.service.bindUserToDepartment(companyId, dept, uid, order || 0, set_def_dept || false)
  }

  async removeUserFromDepartment(companyId: string, dept: WPSDepartment, uid: string) {
    await this.service.removeUserFromDepartment(companyId, dept, uid)
  }

  async updateDepartmentMembersOrder(
    companyId: string,
    deptMembers: DeptMemberOrder[]
  ): Promise<void> {
    for (const deptMember of deptMembers) {
      deptMember.order = deptMember.order || 0
      await this.service.updateDepartmentMemberOrder(companyId, deptMember)
    }
  }

  async addDepartment(
    companyId: string,
    parent_id: string,
    platform_id: string,
    third_dept_id: string,
    name: string,
    order: number,
    source: string,
    type?: string
  ): Promise<WPSDepartment> {
    order = order || 0
    const de = {
      name,
      order,
      third_platform_id: platform_id, // 新增
      third_dept_id: third_dept_id,
      source: source,
    } as WPSDepartment
    if (type) de.type = type
    const did = await this.service.addDepartment(companyId, parent_id, de)
    return this.service.getDepartment(companyId, did)
  }

  // only properties
  async updateDepartment(
    companyId: string,
    dept: WPSDepartment,
    pid: string,
    name: string,
    order?: number,
  ): Promise<void> {
    await this.service.updateDepartment(companyId, dept.dept_id, pid, name, order)
  }

  async moveDepartment(
    companyId: string,
    dept: WPSDepartment,
    parent: WPSDepartment
  ): Promise<void> {
    await this.service.moveDepartment(companyId, dept.dept_id, parent.dept_id)
  }

  async removeDepartment(companyId: string, dept: WPSDepartment): Promise<void> {
    await this.service.removeDepartment(companyId, dept.dept_id)
  }

  async removeDepartments(companyId: string, depts: WPSDepartment[]): Promise<void> {
    const dids = depts.map(e => e.dept_id)
    await this.service.removeDepartments(companyId, dids)
  }

  async getDepartmentById(companyId: string, did: string): Promise<WPSDepartment> {
    return this.service.getDepartment(companyId, did)
  }

  async queryDeptsByThirdUnionId(companyId: string, platform_id: string, union_id: string): Promise<WPSDepartment> {
    const res = await this.queryDeptsByThirdUnionIds(companyId, platform_id, [union_id])
    return res && res.length > 0 ? res[0] : null
  }

  async queryDeptsByThirdUnionIds(companyId: string, platform_id: string, union_ids: string[]): Promise<WPSDepartment[]> {
    return this.service.queryDeptsByThirdUnionId(companyId, platform_id, union_ids)
  }

  async listDepartments(
    companyId: string,
    parent: WPSDepartment,
    offset: number = 0,
    limit: number = -1
  ): Promise<WPSDepartment[]> {
    return this.service.getDepartmentsByParent(
      companyId,
      parent.dept_id,
      offset,
      limit
    )
  }

  async queryUsersByThirdUnionIds(companyId: string, platform_id: string, union_ids: string[]): Promise<WPSUser[]> {
    return this.service.getUsersByThirdUnionIds(companyId, platform_id, union_ids)
  }

  async queryUsersByThirdUnionId(companyId: string, platform_id: string, union_id: string): Promise<WPSUser> {
    const res = await this.queryUsersByThirdUnionIds(companyId, platform_id, [union_id])
    return res && res.length > 0 ? res[0] : null
  }

  async changeAccountDept(companyId: string, change: ChangeUserDept) {
    return this.service.changeAccountDept(companyId, change)
  }

  async clear() {

  }

  async getTenantList(offset: number = 0, limit: number = -1) {
    return this.service.getTenantList(offset, limit)
  }

  async getTenantByCode(thirdCompanyId: string) {
    return this.service.getTenantByCode(thirdCompanyId)
  }

  async createTenant(code: string, name: string): Promise<WPSTenant> {
    return this.service.createTenant(code, name)
  }

  async initTenantAdmin(companyId: string, account: string, password: string): Promise<void> {
    await this.service.initTenantAdmin(companyId, account, password)
  }
}
