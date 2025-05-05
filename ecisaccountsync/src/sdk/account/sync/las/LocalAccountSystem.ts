/* eslint-disable camelcase */
import {
  ILocalAccountService,
  LocalDepartment,
  LocalMember, LocalUser,
} from './types'

export class LocalAccountSystem {
  service: ILocalAccountService

  constructor(service: ILocalAccountService) {
    this.service = service
  }

  async root(taskId: string, thirdCompanyId: string): Promise<LocalDepartment> {
    return this.service.root(taskId, thirdCompanyId)
  }

  async getDepartment(taskId: string, thirdCompanyId: string, platform_id: string, deptId: string): Promise<LocalDepartment> {
    return this.service.getDepartment(taskId, thirdCompanyId, platform_id, deptId)
  }

  async getDepartments(taskId: string, thirdCompanyId: string, platform_id: string, deptIds: string[]): Promise<LocalDepartment[]> {
    return this.service.getDepartments(taskId, thirdCompanyId, platform_id, deptIds)
  }

  async listDepartments(
    taskId: string,
    thirdCompanyId: string,
    platform_id: string,
    pid: string,
    offset: number = 0,
    limit: number = -1
  ): Promise<LocalDepartment[]> {
    return this.service.listDepartments(taskId, thirdCompanyId, platform_id, pid, offset, limit)
  }

  async getUsersByUids(taskId: string, platformId: string, uids: string[]): Promise<LocalUser[]> {
    return this.service.getUsersByUids(taskId, platformId, uids)
  }

  async getAllUsersList(taskId: string, thirdCompanyId: string, platformId: string) {
    let arr: LocalUser[] = []
    const minId = await this.service.getTaskMinOrMaxId(taskId, thirdCompanyId, true);
    const maxId = await this.service.getTaskMinOrMaxId(taskId, thirdCompanyId, false);
    if (!maxId || !minId) {
      return arr
    }

    return this.pageItById(minId, maxId, async (start, end) => {
      return this.service.getAllUsers(taskId, thirdCompanyId, platformId, start, end);
    });
  }

  async getAllUsersListNoCustom(taskId: string, thirdCompanyId: string, platformId: string) {
    let arr: LocalUser[] = []
    const minId = await this.service.getTaskMinOrMaxId(taskId, thirdCompanyId, true);
    const maxId = await this.service.getTaskMinOrMaxId(taskId, thirdCompanyId, false);
    if (!maxId || !minId) {
      return arr
    }

    return this.pageItById(minId, maxId, async (start, end) => {
      return this.service.getAllUsersNoCustom(taskId, thirdCompanyId, platformId, start, end);
    });
  }

  async listUsersByDepartment(
    dept: LocalDepartment,
    offset: number = 0,
    limit: number = -1
  ): Promise<LocalMember[]> {
    return this.service.getUsersByDepartment(dept.task_id, dept.third_company_id, dept.platform_id, dept.did, offset, limit)
  }

  async listDeptUsers(
      task_id: string,
      third_company_id: string,
      platform_id: string,
      did: string,
      offset: number = 0,
      limit: number = -1
  ): Promise<LocalMember[]> {
    return this.service.getUsersByDepartment(task_id, third_company_id, platform_id, did, offset, limit)
  }

  async getDeptUids(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
    return this.service.getDeptUids(taskId, thirdCompanyId, platformId, did)
  }

  async getNoDeptUids(taskId: string, thirdCompanyId: string, platformId: string) {
    return this.service.getNoDeptUids(taskId, thirdCompanyId, platformId)
  }

  async cancelDeptCheck(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
    return this.service.cancelDeptCheck(taskId, thirdCompanyId, platformId, did)
  }

  async checkDept(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
    return this.service.checkDept(taskId, thirdCompanyId, platformId, did)
  }

  async cancelUserCheck(taskId: string, thirdCompanyId: string, platformId: string, uids: string[]) {
    return this.service.cancelUserCheck(taskId, thirdCompanyId, platformId, uids)
  }

  async checkUsers(taskId: string, thirdCompanyId: string, platformId: string, uids: string[]) {
    return this.service.checkUsers(taskId, thirdCompanyId, platformId, uids)
  }

  async cancelDeptUserCheck(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
    return this.service.cancelDeptUserCheck(taskId, thirdCompanyId, platformId, did)
  }

  async checkDeptUser(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
    return this.service.checkDeptUser(taskId, thirdCompanyId, platformId, did)
  }

  /**
   * 重置check_type
   * @param taskId
   * @param thirdCompanyId
   * @param platformIds
   * @param enable true: 重置为1，false: 重置为0
   */
  async resetCheckType(taskId: string, thirdCompanyId: string, platformIds: string[], enable: boolean) {
    for (const platformId of platformIds) {
      // 重置部门表check_type
      let minDeptId = await this.service.getDeptMinOrMaxId(taskId, thirdCompanyId, platformId, 'ASC')
      let maxDeptId = await this.service.getDeptMinOrMaxId(taskId, thirdCompanyId, platformId, 'DESC')
      if (maxDeptId != 0) {
        await this.pageUpdateById(minDeptId, maxDeptId, async (start, end) => {
          await this.service.pageResetDeptCheckType(start, end, enable)
        });
      }
      // 重置部门用户表check_type
      let minDeptUserId = await this.service.getDeptUerMinOrMaxId(taskId, thirdCompanyId, platformId, 'ASC')
      let maxDeptUserId = await this.service.getDeptUerMinOrMaxId(taskId, thirdCompanyId, platformId, 'DESC')
      if (maxDeptUserId != 0) {
        await this.pageUpdateById(minDeptUserId, maxDeptUserId, async (start, end) => {
          await this.service.pageResetDeptUserCheckType(start, end, enable)
        });
      }
    }
    // 重置用户表check_type
    let minUserId = await this.service.getTaskMinOrMaxId(taskId, thirdCompanyId, true)
    let maxUserId = await this.service.getTaskMinOrMaxId(taskId, thirdCompanyId, false)
    if (maxUserId) {
      await this.pageUpdateById(minUserId, maxUserId, async (start, end) => {
        await this.service.pageResetUserCheckType(start, end, enable);
      });
    }
  }

  async deleteDeptsAndUsersByTaskId(taskId: string) {
    return this.service.deleteDeptsAndUsersByTaskId(taskId)
  }

  async getDistinctTaskId(): Promise<string[]> {
    return this.service.getDistinctTaskId()
  }

  async statisticsLasData(taskId: string, thirdCompanyId: string) {
    return this.service.statisticsLasData(taskId, thirdCompanyId)
  }

  async countLasData() {
    return this.service.countLasData()
  }

  async getAllDeptUserList(taskId: string, thirdCompanyId: string, platformId: string) {
    return this.service.getAllDeptUserList(taskId, thirdCompanyId, platformId)
  }

  async pageQueryDeptUsers(taskId: string, thirdCompanyId: string, platformId: string, startId: number, endId: number) {
    return this.pageItById(startId, endId, async (s, e) => {
      return this.service.pageQueryDeptUsers(taskId, thirdCompanyId, platformId, s, e)
    })
  }

  async pageQueryDepts(taskId: string, thirdCompanyId: string, platformId: string, startId: number, endId: number) {
    return this.pageItById(startId, endId, async (s, e) => {
      return this.service.pageQueryDepts(taskId, thirdCompanyId, platformId, s, e)
    })
  }

  async pageQueryDeptUsersByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number) {
    return this.pageItById(startId, endId, async (s, e) => {
      return this.service.pageQueryDeptUsersByMidTable(taskId, thirdCompanyId, s, e)
    })
  }

  async pageQueryDeptsByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number) {
    return this.pageItById(startId, endId, async (s, e) => {
      return this.service.pageQueryDeptsByMidTable(taskId, thirdCompanyId, s, e)
    })
  }

  async pageQueryUsersByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number) {
    return this.pageItById(startId, endId, async (s, e) => {
      return this.service.pageQueryUsersByMidTable(taskId, thirdCompanyId, s, e)
    })
  }

  async getDeptUerMinOrMaxId(taskId: string, thirdCompanyId: string, platformId: string, order: string) {
    return this.service.getDeptUerMinOrMaxId(taskId, thirdCompanyId, platformId, order)
  }

  async getDeptMinOrMaxId(taskId: string, thirdCompanyId: string, platformId: string, order: string) {
    return this.service.getDeptMinOrMaxId(taskId, thirdCompanyId, platformId, order)
  }

  /**
   * 不按checkType过滤，查所有数据
   */
  async getDepartmentsNoCheck(taskId: string, thirdCompanyId: string, platform_id: string, deptIds: string[]): Promise<LocalDepartment[]> {
    return this.service.getDepartmentsNoCheck(taskId, thirdCompanyId, platform_id, deptIds)
  }

  async getDepartmentNoCheck(taskId: string, thirdCompanyId: string, platform_id: string, deptId: string): Promise<LocalDepartment> {
    return this.service.getDepartmentNoCheck(taskId, thirdCompanyId, platform_id, deptId)
  }

  async listDepartmentsNoCheck(
      taskId: string,
      thirdCompanyId: string,
      platform_id: string,
      pid: string,
      offset: number = 0,
      limit: number = -1
  ): Promise<LocalDepartment[]> {
    return this.service.listDepartmentsNoCheck(taskId, thirdCompanyId, platform_id, pid, offset, limit)
  }

  private async pageUpdateById<T>(
      startId: number,
      endId: number,
      func: { (s: number, e: number): Promise<void> }
  ) {
    if (startId == endId) {
      await func(startId, startId + 1)
    } else {
      const start = startId
      for (let i = start; i < endId; i += 10000) {
        const end  = i + 10000 >= endId ? endId + 1 : i + 10000
        await func(i, end)
      }
    }
  }

  private async pageItById<T>(
      startId: number,
      endId: number,
      func: { (s: number, e: number): Promise<T[]> }
  ) {
    let items: T[] = []
    if (startId == endId) {
      const ret = await func(startId, startId + 1)
      if (Array.isArray(ret) && ret.length > 0) {
        items = items.concat(ret)
      }
    } else {
      const start = startId
      for (let i = start; i < endId; i += 1000) {
        const end  = i + 1000 >= endId ? endId + 1 : i + 1000
        const ret = await func(i, end)
        if (Array.isArray(ret) && ret.length > 0) {
          items = items.concat(ret)
        }
      }
    }
    return items
  }

  private async pageIt<T>(
      limit: number,
      offset: number,
      func: { (l: number, o: number): Promise<T[]> }
  ) {
    const start = offset
    const end = limit > 0 ? offset + limit : -1
    let items: T[] = []
    for (let i = start; i < end || end === -1; i += 1000) {
      const l = end > 0 ? (end - i < 1000 ? end - i : 1000) : 1000
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
      groupSize: number = 100
  ) {
    const groupList = this.averageList(data, groupSize)
    for (const objectGroup of groupList) {
      await func(objectGroup)
    }
  }

  averageList<T>(list: T[], groupSize: number = 100): T[][] {
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
