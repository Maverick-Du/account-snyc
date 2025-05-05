/* eslint-disable camelcase */
import {IDatabase, Query, Table} from '../../../cognac/orm'
import {
    CheckTypeEnum,
    DEFAULT_ROOT_DEPT_ID,
    DEFAULT_ROOT_DEPT_P_ID,
    DEFAULT_ROOT_PLATFORM_ID,
    ILocalAccountService,
    LocalCountData,
    LocalDepartment,
    LocalDeptUser,
    LocalMember,
    LocalUser
} from './types'
import {
    DepartmentSchema,
    DepartmentUserSchema,
    LASDepartmentTable,
    LASDepartmentUserTable,
    LASUserTable,
    UserSchema
} from './tables'
import {FullSyncTaskStatistics} from "../engine";
import config from "../../../../common/config";
import * as util from "../../../../common/util";

export class LocalAccountService implements ILocalAccountService {
  db: IDatabase

  deptTable: LASDepartmentTable
  userTable: LASUserTable
  deptUserTable: LASDepartmentUserTable

  defaultRootPlatformId: string = DEFAULT_ROOT_PLATFORM_ID
  defaultRootDeptId: string = DEFAULT_ROOT_DEPT_ID

  constructor(db: IDatabase, cf?: {
    defaultRootPlatformId: string
    defaultRootDeptId: string
  }) {
    this.db = db
    this.deptTable = new LASDepartmentTable(db)
    this.userTable = new LASUserTable(db)
    this.deptUserTable = new LASDepartmentUserTable(db)
    if (cf) {
      this.defaultRootPlatformId = cf.defaultRootPlatformId
      this.defaultRootDeptId = cf.defaultRootDeptId
    }
  }

  async root(taskId: string, thirdCompanyId: string): Promise<LocalDepartment> {
    let rootPid = util.getFieldDbContent(DEFAULT_ROOT_DEPT_P_ID)
    let data = await this.deptTable.getRoot(taskId, thirdCompanyId, rootPid)
    if (!data || data.length <= 0) {
        throw new Error(`采集表根部门不存在. taskId: ${taskId}, thirdCompanyId: ${thirdCompanyId}`)
    }
    if (data && data.length > 1) {
        throw new Error(`采集表存在多个根部门. taskId: ${taskId}, thirdCompanyId: ${thirdCompanyId}`)
    }
    return this.convertLocalDept(data[0])
  }

  async getDepartment(taskId: string, thirdCompanyId: string, platformId: string, did: string): Promise<LocalDepartment> {
      did = util.getFieldDbContent(did)
      let ld = await this.deptTable.getById(taskId, thirdCompanyId, platformId, did)
      return this.convertLocalDept(ld)
  }

  async getDepartments(taskId: string, thirdCompanyId: string, platformId: string, dids: string[]): Promise<LocalDepartment[]> {
      dids = util.getFieldDbContents(dids)
      let lds = await this.deptTable.getByIds(taskId, thirdCompanyId, platformId, dids)
      return this.convertLocalDepts(lds)
  }

  async getAllDeptUserList(taskId: string, thirdCompanyId: string, platformId: string): Promise<LocalDeptUser[]> {
      let dus = await this.deptUserTable.getAllSeptUserList(taskId, thirdCompanyId, platformId)
      return this.convertLocalDeptUsers(dus)
  }

  async pageQueryDeptUsers(taskId: string, thirdCompanyId: string, platformId: string, startId: number, endId: number) {
      let deptUsers = await this.deptUserTable.pageQueryDeptUsers(startId, endId)
      let dus = deptUsers.filter(d => d.task_id == taskId && d.third_company_id == thirdCompanyId && d.platform_id == platformId && d.check_type > 0)
      return this.convertLocalDeptUsers(dus)
  }

  async pageQueryDepts(taskId: string, thirdCompanyId: string, platformId: string, startId: number, endId: number) {
      let depts = await this.deptTable.pageQueryDepts(startId, endId)
      let ds = this.convertLocalDepts(depts)
      return ds.filter(d => d.task_id == taskId && d.third_company_id == thirdCompanyId && d.platform_id == platformId && d.check_type > 0)
  }

  async pageQueryDeptUsersByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number) {
    let deptUsers = await this.deptUserTable.pageQueryDeptUsers(startId, endId)
    let dus = deptUsers.filter(d => d.task_id == taskId && d.third_company_id == thirdCompanyId)
    return this.convertLocalDeptUsers(dus)
  }

  async pageQueryDeptsByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number) {
    let depts = await this.deptTable.pageQueryDepts(startId, endId)
    let ds = this.convertLocalDepts(depts)
    return ds.filter(d => d.task_id == taskId && d.third_company_id == thirdCompanyId )
  }

  async pageQueryUsersByMidTable(taskId: string, thirdCompanyId: string, startId: number, endId: number) {
    let users = await this.userTable.getUsersById(startId, endId)
    let us = users.filter(d => d.task_id == taskId && d.third_company_id == thirdCompanyId)
    return us.map(x => {
        x.uid = util.getFieldOriginContent(x.uid)
        x.account = util.getFieldOriginContent(x.account)
        return x
    })
  }

  async getDeptUerMinOrMaxId(taskId: string, thirdCompanyId: string, platformId: string, order: string): Promise<number>{
      return this.deptUserTable.getDeptUerMinOrMaxId(taskId, thirdCompanyId, platformId, order)
  }

  async getDeptMinOrMaxId(taskId: string, thirdCompanyId: string, platformId: string, order: string): Promise<number>{
    return this.deptTable.getDeptMinOrMaxId(taskId, thirdCompanyId, platformId, order)
  }

  async listDepartments(
    taskId:string,
    thirdCompanyId: string,
    platform_id: string,
    pid: string,
    offset: number = 0,
    limit: number = -1
  ): Promise<LocalDepartment[]> {
      pid = util.getFieldDbContent(pid)
      let lds = await this.deptTable.listByParentId(taskId, thirdCompanyId, platform_id, pid, offset, limit)
      return this.convertLocalDepts(lds)
  }

  async getUsersByUids(taskId: string, platformId: string, uids: string[]): Promise<LocalUser[]> {
      uids = util.getFieldDbContents(uids)
      const users = await this.userTable.getUsersByUids(taskId, platformId, uids)
      return users.map(x => this.tansformUser(x))
  }

  async getAllUsers(
    taskId: string,
    thirdCompanyId: string,
    platformId: string,
    startIndex: number,
    endIndex: number
  ): Promise<LocalUser[]> {
    const users = await this.userTable.getUsersById(startIndex, endIndex);

    if (users?.length) {
      return users.map(item => {
        const { third_company_id, task_id, check_type, platform_id } = item || {};

        if (taskId === task_id && thirdCompanyId === third_company_id && platformId === platform_id && check_type === CheckTypeEnum.ENABLE) {
          return this.tansformUser(item);
        }

        return null;
      }).filter(Boolean);
    }
    return [];
  }

  async getAllUsersNoCustom(
        taskId: string,
        thirdCompanyId: string,
        platformId: string,
        startIndex: number,
        endIndex: number
  ): Promise<LocalUser[]> {
      const users = await this.userTable.getUsersById(startIndex, endIndex);

      if (users?.length) {
          return users.map(item => {
                const { third_company_id, task_id, check_type, platform_id } = item || {};

                if (taskId === task_id && thirdCompanyId === third_company_id && platformId === platform_id && check_type === CheckTypeEnum.ENABLE) {
                    return this.tansformUserNoCustomFiled(item);
                }

                return null;
          }).filter(Boolean);
      }
      return [];
  }

  async getTaskMinOrMaxId(taskId: string, thirdCompanyId: string, isMin: boolean) {
    if (isMin) {
      return this.userTable.getTaskMinId(taskId, thirdCompanyId);
    }

    return this.userTable.getTaskMaxId(taskId, thirdCompanyId);
  }

  async getUsersByDepartment(
    taskId: string,
    thirdCompanyId: string,
    platform_id: string,
    did: string,
    offset: number = 0,
    limit: number = -1
  ): Promise<LocalMember[]> {
      did = util.getFieldDbContent(did)
      const q = ' U.*, D.main, D.order '
      const query = Query.select(q).from('tb_las_department_user D JOIN tb_las_user U ON D.uid = U.uid and D.platform_id = U.platform_id and D.task_id = U.task_id')
      .where('D.did =? AND D.task_id = ? AND D.platform_id =? AND D.third_company_id =? AND D.check_type =?', did, taskId, platform_id, thirdCompanyId, CheckTypeEnum.ENABLE)

      if (limit > 0) query.limit(limit, offset)
      const ret = await query.exec(this.db)

      const rows = Table.array(ret.data.rows)
      return rows.map(x => this.tansformMember(x as any))
  }

  async getDeptUids(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
      did = util.getFieldDbContent(did)
      let uids = await this.deptUserTable.getDeptUids(taskId, thirdCompanyId, platformId, did)
      return util.getFieldOriginContents(uids)
  }

  async getNoDeptUids(taskId: string, thirdCompanyId: string, platformId: string) {
      let uids = await this.userTable.getNoDeptUsers(taskId, thirdCompanyId, platformId)
      return util.getFieldOriginContents(uids)
  }

  async cancelDeptCheck(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
      did = util.getFieldDbContent(did)
      await this.deptTable.cancelCheck(taskId, thirdCompanyId, platformId, did)
  }

  async checkDept(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
      did = util.getFieldDbContent(did)
      await this.deptTable.checkDept(taskId, thirdCompanyId, platformId, did)
  }

  async cancelUserCheck(taskId: string, thirdCompanyId: string, platformId: string, uids: string[]) {
      uids = util.getFieldDbContents(uids)
      await this.userTable.cancelCheck(taskId, thirdCompanyId, platformId, uids)
  }

  async checkUsers(taskId: string, thirdCompanyId: string, platformId: string, uids: string[]) {
      uids = util.getFieldDbContents(uids)
      await this.userTable.checkUsers(taskId, thirdCompanyId, platformId, uids)
  }

  async cancelDeptUserCheck(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
      did = util.getFieldDbContent(did)
      await this.deptUserTable.cancelCheck(taskId, thirdCompanyId, platformId, did)
  }

  async checkDeptUser(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
      did = util.getFieldDbContent(did)
      await this.deptUserTable.checkDeptUser(taskId, thirdCompanyId, platformId, did)
  }

  async pageResetDeptCheckType(startId: number, endId: number, enable: boolean) {
      await this.deptTable.pageResetCheckType(startId, endId, enable)
  }

  async pageResetUserCheckType(startId: number, endId: number, enable: boolean) {
      await this.userTable.pageResetCheckType(startId, endId, enable)
  }

  async pageResetDeptUserCheckType(startId: number, endId: number, enable: boolean) {
      await this.deptUserTable.pageResetCheckType(startId, endId, enable)
  }

  async deleteDeptsAndUsersByTaskId(taskId: string) {
    await this.deptTable.deleteByTaskId(taskId)
    await this.userTable.deleteByTaskId(taskId)
    await this.deptUserTable.deleteByTaskId(taskId)
  }

  async getDistinctTaskId(): Promise<string[]> {
    return this.deptTable.getDistinctTaskId()
  }

  async statisticsLasData(taskId: string, thirdCompanyId: string): Promise<FullSyncTaskStatistics> {
      let deptCountData = await this.deptTable.countTaskData(taskId, thirdCompanyId)
      const deptCountRows: any[] = Table.array(deptCountData.data.rows)
      let deptCount = deptCountRows[0]?.total
      let userCountData = await this.userTable.countTaskData(taskId, thirdCompanyId)
      const userCountRows: any[] = Table.array(userCountData.data.rows)
      let userCount = userCountRows[0]?.total
      let deptUserCountData = await this.deptUserTable.countTaskData(taskId, thirdCompanyId)
      const deptUserCountRows: any[] = Table.array(deptUserCountData.data.rows)
      let deptUserCount = deptUserCountRows[0]?.total

      let scopeDeptCountData = await this.deptTable.countTaskData(taskId, thirdCompanyId, CheckTypeEnum.ENABLE)
      const scopeDeptCountRows: any[] = Table.array(scopeDeptCountData.data.rows)
      let scopeDeptCount = scopeDeptCountRows[0]?.total
      let scopeUserCountData = await this.userTable.countTaskData(taskId, thirdCompanyId, CheckTypeEnum.ENABLE)
      const scopeUserCountRows: any[] = Table.array(scopeUserCountData.data.rows)
      let scopeUserCount = scopeUserCountRows[0]?.total
      let scopeDeptUserCountData = await this.deptUserTable.countTaskData(taskId, thirdCompanyId, CheckTypeEnum.ENABLE)
      const scopeDeptUserCountRows: any[] = Table.array(scopeDeptUserCountData.data.rows)
      let scopeDeptUserCount = scopeDeptUserCountRows[0]?.total

      return {
          task_id: taskId,
          company_id: thirdCompanyId,
          total_dept: deptCount,
          total_dept_user: deptUserCount,
          total_user: userCount,
          scope_dept: scopeDeptCount,
          scope_user: scopeUserCount,
          scope_dept_user: scopeDeptUserCount,
      }
  }

  async countLasData(): Promise<LocalCountData> {
      let deptCountData = await this.deptTable.countData()
      let deptUserCountData = await this.deptUserTable.countData()
      let userCountData = await this.userTable.countData()
      const deptCountRows: any[] = Table.array(deptCountData.data.rows)
      let deptCount = deptCountRows[0]?.total
      const userCountRows: any[] = Table.array(userCountData.data.rows)
      let userCount = userCountRows[0]?.total
      const deptUserCountRows: any[] = Table.array(deptUserCountData.data.rows)
      let deptUserCount = deptUserCountRows[0]?.total
      return {
          deptCount: deptCount,
          userCount: userCount,
          deptUserCount: deptUserCount
      }
  }

    async getDepartmentNoCheck(taskId: string, thirdCompanyId: string, platformId: string, did: string): Promise<LocalDepartment> {
        did = util.getFieldDbContent(did)
        let ld = await this.deptTable.getByIdNoCheck(taskId, thirdCompanyId, platformId, did)
        return this.convertLocalDept(ld)
    }

    async getDepartmentsNoCheck(taskId: string, thirdCompanyId: string, platformId: string, dids: string[]): Promise<LocalDepartment[]> {
        dids = util.getFieldDbContents(dids)
        let lds = await this.deptTable.getByIdsNoCheck(taskId, thirdCompanyId, platformId, dids)
        return this.convertLocalDepts(lds)
    }

    async listDepartmentsNoCheck(
        taskId:string,
        thirdCompanyId: string,
        platform_id: string,
        pid: string,
        offset: number = 0,
        limit: number = 0
    ): Promise<LocalDepartment[]> {
        pid = util.getFieldDbContent(pid)
        let lds = await this.deptTable.listByParentIdNoCheck(taskId, thirdCompanyId, platform_id, pid, offset, limit)
        return this.convertLocalDepts(lds)
    }

    async countLasTaskData(taskId: string, thirdCompanyId: string): Promise<LocalCountData> {
      let deptCountTaskData = await this.deptTable.countDepartmentTaskData(taskId, thirdCompanyId)
      let deptUserCountTaskData = await this.deptUserTable.countDepartmentUserTaskData(taskId, thirdCompanyId)
      let userCountTaskData = await this.userTable.countUserTaskData(taskId, thirdCompanyId)
      const deptCountRows: any[] = Table.array(deptCountTaskData.data.rows)
      let deptTaskCount = deptCountRows[0]?.total
      const userCountRows: any[] = Table.array(userCountTaskData.data.rows)
      let userTaskCount = userCountRows[0]?.total
      const deptUserCountRows: any[] = Table.array(deptUserCountTaskData.data.rows)
      let deptUserTaskCount = deptUserCountRows[0]?.total
      return {
        deptCount: deptTaskCount,
        userCount: userTaskCount,
        deptUserCount: deptUserTaskCount
      }
    }

    convertLocalDept(dept: DepartmentSchema): LocalDepartment {
        if (config.caseSensitive && dept) {
            dept.did = util.getFieldOriginContent(dept.did)
            dept.pid = util.getFieldOriginContent(dept.pid)
            return dept as LocalDepartment
        } else {
            return dept as LocalDepartment
        }
    }

    convertLocalDepts(depts: DepartmentSchema[]): LocalDepartment[] {
        if (config.caseSensitive && depts && depts.length > 0) {
            return depts.map(dept => {
                dept.did = util.getFieldOriginContent(dept.did)
                dept.pid = util.getFieldOriginContent(dept.pid)
                return dept as LocalDepartment
            })
        } else {
            return depts
        }
    }

    convertLocalDeptUser(deptUser: DepartmentUserSchema): LocalDeptUser {
        if (config.caseSensitive && deptUser) {
            deptUser.did = util.getFieldOriginContent(deptUser.did)
            deptUser.uid = util.getFieldOriginContent(deptUser.uid)
            return deptUser as LocalDeptUser
        } else {
            return deptUser as LocalDeptUser
        }
    }

    convertLocalDeptUsers(deptUsers: DepartmentUserSchema[]): LocalDeptUser[] {
        if (config.caseSensitive && deptUsers && deptUsers.length > 0) {
            return deptUsers.map(deptUser => {
                deptUser.did = util.getFieldOriginContent(deptUser.did)
                deptUser.uid = util.getFieldOriginContent(deptUser.uid)
                return deptUser as LocalDeptUser
            })
        } else {
            return deptUsers
        }
    }

    private tansformUserNoCustomFiled(user: UserSchema): LocalUser {
        return (
            user && {
                uid: util.getFieldOriginContent(user.uid),
                task_id: user.task_id,
                third_company_id: user.third_company_id,
                platform_id: user.platform_id,
                name: util.getFieldOriginContent(user.account),
                nick_name: user.nick_name,
                def_did: user.def_did,
                def_did_order: user.def_did_order,

                password: user.password,
                // role: user.role,
                avatar: user.avatar,
                email: user.email,
                gender: user.gender,
                title: user.title,
                work_place: user.work_place,
                leader: user.leader,
                phone: user.phone,
                telephone: user.telephone,

                employer: user.employer,
                employment_status: user.employment_status,
                employment_type: user.employment_type,
                source: user.source,
                ctime: user.ctime,
                mtime: user.mtime,
                // custom_fields: user.custom_fields ? JSON.parse(user.custom_fields) : null
            }
        )
    }

    private tansformUser(user: UserSchema): LocalUser {
        return (
            user && {
                uid: util.getFieldOriginContent(user.uid),
                task_id: user.task_id,
                third_company_id: user.third_company_id,
                platform_id: user.platform_id,
                name: util.getFieldOriginContent(user.account),
                nick_name: user.nick_name,
                def_did: user.def_did,
                def_did_order: user.def_did_order,

                password: user.password,
                // role: user.role,
                avatar: user.avatar,
                email: user.email,
                gender: user.gender,
                title: user.title,
                work_place: user.work_place,
                leader: user.leader,
                phone: user.phone,
                telephone: user.telephone,

                employer: user.employer,
                employment_status: user.employment_status,
                employment_type: user.employment_type,
                source: user.source,
                ctime: user.ctime,
                mtime: user.mtime,
                custom_fields: user.custom_fields ? JSON.parse(user.custom_fields) : null
            }
        )
    }

    private tansformMember(user: any): LocalMember {
        const lu = this.tansformUser(user) as LocalMember
        lu.order = user.order
        lu.main = user.main
        return lu
    }
}
