/* eslint-disable camelcase */
import {
  AddUser2DeptResult,
  BatchCreateChildDeptsResult,
  BatchGetCompanyUsersResult,
  ChangeUserDept,
  ChangeUserDeptResult,
  CompanyDept,
  CompanyUser,
  DelCompanyDeptResult,
  DelUserDeptResult,
  DisableCompanyUserResult,
  EnableCompanyUserResult,
  GetBatchCompanyDeptsResult,
  GetCompanyDeptResult,
  GetCompanyUserResult,
  GetDeptUsersResult,
  MoveCompanyDeptResult,
  PostCompanyDeptResult,
  UpdateCompanyDeptResult,
  UpdateCompanyUser,
  UpdateDeptUserSortResult
} from './types'

import { AccountStatus } from '../../../tenant'
import {WPS4Context, WPS4Params, WPS4Request} from "../../../../common/wps4";

export class CompaniesService {
  ctx: WPS4Context

  constructor(ctx: WPS4Context) {
    this.ctx = ctx
  }

  private query(params: WPS4Params = {}) {
    return {
      ...params
    }
  }

  /**
     * 1.获取根部门
     * 2.获取部门信息
     * 3.批量获取部门信息
     * 4.获取子部门列表
     * 5.创建子部门
     * 6.批量创建子部门
     * 7.修改部门
     * 8.修改部门名称
     * 9.移动部门
     * 10.删除部门
     * 11.批量删除部门
     */

  async root(companyId: string) {
    const req = new WPS4Request(this.ctx)
    return req.get<GetCompanyDeptResult>(
      `/org/dev/v1/companies/${companyId}/depts/root`,
      this.query()
    )
  }

  async getDept(companyId: string, dept_id: string) {
    const req = new WPS4Request(this.ctx)
    return req.get<GetCompanyDeptResult>(
      `/org/dev/v1/companies/${companyId}/depts/${dept_id}`,
      this.query()
    )
  }

  async getDepts(companyId: string, dept_ids: string[]) {
    const req = new WPS4Request(this.ctx)
    return req.post<GetBatchCompanyDeptsResult>(
      `/org/dev/v1/companies/${companyId}/depts`,
      this.query(),
      {
        dept_ids
      }
    )
  }

  async getDeptsByThirdUnionIds(companyId: string, platform_id: string, union_ids: string[]) {
    const req = new WPS4Request(this.ctx)
    return req.post<GetBatchCompanyDeptsResult>(
      `/org/dev/v1/companies/${companyId}/thirddepts`,
      this.query(),
      {
        platform_id,
        union_ids
      }
    )
  }

  async getChildDepts(companyId: string, dept_id: string, offset: number, limit: number) {
    const req = new WPS4Request(this.ctx)
    return req.get<GetBatchCompanyDeptsResult>(
      `/org/dev/v1/companies/${companyId}/depts/${dept_id}/depts`,
      this.query({ offset, limit })
    )
  }

  async createChildDept(companyId: string, pid: string, dept: CompanyDept) {
    const req = new WPS4Request(this.ctx)
    return req.post<PostCompanyDeptResult>(
      `/org/dev/v1/companies/${companyId}/depts/${pid}`,
      this.query(),
      dept
    )
  }

  async batchCreateChildDepts(companyId: string, pid: string, depts: CompanyDept[]) {
    const req = new WPS4Request(this.ctx)
    return req.post<BatchCreateChildDeptsResult>(
      `/org/dev/v1/batch/companies/${companyId}/depts/${pid}`,
      this.query(),
      {
        depts
      }
    )
  }

  async updateDept(companyId: string, dept_id: string, name: string, weight?: number) {
    const req = new WPS4Request(this.ctx)
    let data: any = {name: name}
    if (weight) data.weight = weight
    return req.post<UpdateCompanyDeptResult>(
        `/org/dev/v1/update/companies/${companyId}/depts/${dept_id}`,
        this.query(),
        data
    )
  }

  async moveDept(companyId: string, dept_id: string, to_parent_id: string) {
    const req = new WPS4Request(this.ctx)
    return req.post<MoveCompanyDeptResult>(
      `/org/dev/v1/companies/${companyId}/depts/move`,
      this.query(),
      {
        dept_id,
        to_parent_id
      }
    )
  }

  async delDept(companyId: string, dept_id: string) {
    const req = new WPS4Request(this.ctx)
    return req.post<DelCompanyDeptResult>(
      `/org/dev/v1/delete/companies/${companyId}/depts/${dept_id}`,
      this.query()
    )
  }

  async batchDelDept(companyId: string, dept_ids: string[]) {
    const req = new WPS4Request(this.ctx)
    // TODO 返回值结构确认
    return req.post<PostCompanyDeptResult>(
      `/org/dev/v1/delete/companies/${companyId}/depts`,
      this.query(),
      {
        dept_ids
      }
    )
  }

  /**
     * 1.获取企业成员
     * 2.批量获取企业成员
     * 3.创建企业成员
     * 4.修改企业成员信息
     * 5.启用企业成员
     * 6.禁用企业成员
     * 7.删除企业成员
     */
  async getMember(companyId: string, id: string) {
    const req = new WPS4Request(this.ctx)
    return req.get<GetCompanyUserResult>(
      `/org/dev/v1/companies/${companyId}/members/${id}`,
      this.query()
    )
  }

  async batchGetMembers(companyId: string, ids: string[]) {
    const req = new WPS4Request(this.ctx)
    return req.post<BatchGetCompanyUsersResult>(
      `/org/dev/v1/batch/companies/${companyId}/members`,
      this.query(),
      {
        account_ids: ids
      }
    )
  }

  async getMembers(
      companyId: string,
      platform_id: string,
      status: AccountStatus[],
      offset: number,
      limit: number
  ) {
    const req = new WPS4Request(this.ctx)
    return req.get<BatchGetCompanyUsersResult>(
      `/org/dev/v1/companies/${companyId}/members`,
      this.query({
        platform_id,
        offset,
        limit,
        status
      })
    )
  }

  async getThirdUsersByThirdUnionIds(companyId: string, platform_id: string, union_ids: string[]) {
    const req = new WPS4Request(this.ctx)
    return req.post<BatchGetCompanyUsersResult>(
      `/org/dev/v1/batch/companies/${companyId}/thirdusers`,
      this.query(),
      {
        platform_id,
        union_ids
      }
    )
  }

  async createMember(companyId: string, user: CompanyUser) {
    const req = new WPS4Request(this.ctx)
    return req.post<GetCompanyUserResult>(
      `/org/dev/v1/companies/${companyId}/members`,
      this.query(),
      user
    )
  }

  async updateMember(companyId: string, id: string, update: UpdateCompanyUser) {
    const req = new WPS4Request(this.ctx)
    return req.post<GetCompanyUserResult>(
      `/org/dev/v1/companies/${companyId}/members/${id}`,
      this.query(),
      update
    )
  }

  async batchEnableMembers(companyId: string, ids: string[]) {
    const req = new WPS4Request(this.ctx)
    return req.post<EnableCompanyUserResult>(
      `/org/dev/v1/batch/companies/${companyId}/members/enable`,
      this.query(),
      {
        account_ids: ids
      }
    )
  }

  async batchDisableMembers(companyId: string, ids: string[]) {
    const req = new WPS4Request(this.ctx)
    return req.post<DisableCompanyUserResult>(
      `/org/dev/v1/batch/companies/${companyId}/members/disable`,
      this.query(),
      {
        account_ids: ids
      }
    )
  }

  async batchDeleteMembers(companyId: string, ids: string[]) {
    const req = new WPS4Request(this.ctx)
    // TODO 确认返回值
    return req.post<EnableCompanyUserResult>(
      `/org/dev/v1/delete/batch/companies/${companyId}/members`,
      this.query(),
      {
        account_ids: ids
      }
    )
  }

  /**
     * 1.获取用户的部门列表
     * 2.添加用户到某部门
     * 3.用户退出某部门
     * 4.将用户从某部门调整到其他部门
     */
  async getMemberDepts(companyId: string, uid: string) {
    const req = new WPS4Request(this.ctx)
    return req.get<GetBatchCompanyDeptsResult>(
      `/org/dev/v1/companies/${companyId}/members/${uid}/depts`,
      this.query()
    )
  }

  async getDeptMembers(companyId: string, did: string, offset: number, limit: number, status: AccountStatus[]) {
    // let statusStr = ''
    // eslint-disable-next-line no-return-assign
    // status.forEach(e => statusStr = statusStr + e + ',')
    // statusStr = statusStr.substring(0, statusStr.length - 1)

    const req = new WPS4Request(this.ctx)
    return req.get<GetDeptUsersResult>(
      `/org/dev/v1/companies/${companyId}/depts/${did}/members`,
      this.query({
        offset,
        limit,
        status
      })
    )
  }

  async addMemberToDept(companyId: string, uid: string, did: string, weight: number, set_def_dept: boolean) {
    const req = new WPS4Request(this.ctx)
    return req.post<AddUser2DeptResult>(
      `/org/dev/v1/companies/${companyId}/depts/${did}/members/${uid}`,
      this.query(),
      {
        weight,
        set_def_dept
      }
    )
  }

  async deleteMemberFromDept(companyId: string, uid: string, did: string) {
    const req = new WPS4Request(this.ctx)
    return req.post<DelUserDeptResult>(
      `/org/dev/v2/delete/companies/${companyId}/depts/${did}/members/${uid}`,
      this.query()
    )
  }

  // 主部门的更新
  async changeAccountDept(companyId: string, change: ChangeUserDept) {
    const req = new WPS4Request(this.ctx)
    return req.post<ChangeUserDeptResult>(
      `/org/dev/v1/companies/${companyId}/change_account_dept`,
      this.query(),
      change
    )
  }

  async updateDeptMemberSort(companyId: string, did: string, uid: string, weight: number) {
    const req = new WPS4Request(this.ctx)
    return req.post<UpdateDeptUserSortResult>(
      `/org/dev/v1/companies/${companyId}/depts/${did}/members/${uid}/weight`,
      this.query(),
      { weight }
    )
  }
}
