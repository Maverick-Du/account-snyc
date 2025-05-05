/* eslint-disable camelcase */
import { IDatabase, Table } from '../../../../cognac/orm'
import {CheckTypeEnum} from "../types";

export interface DepartmentUserSchema {
  id:number
  task_id: string
  third_company_id: string
  platform_id: string
  uid:string
  did:string
  order:number
  check_type: CheckTypeEnum
  main:number
  leader: number
  ctime:number
}

export class LASDepartmentUserTable extends Table<DepartmentUserSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_las_department_user')
  }

  async getUserMainDept(task_id: string, platform_id: string, uid: string): Promise<DepartmentUserSchema> {
    return this.get('uid=? and task_id =? AND platform_id=? AND main = 1 and check_type =?', uid, task_id, platform_id, CheckTypeEnum.ENABLE).query()
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    await this.remove('task_id =?', taskId).query()
  }

  async countTaskData(taskId: string, third_company_id: string, check_type?: CheckTypeEnum) {
    let sql = 'select count(1) as total from tb_las_department_user where task_id=? and third_company_id =?'
    let arr: any[] = [taskId, third_company_id]
    if (check_type) {
      sql = `${sql} and check_type =?`
      arr.push(check_type)
    }

    return this.db.select(sql, arr)
  }

  async countData() {
    return this.db.select('select count(1) as total from tb_las_department_user', [])
  }

  async getAllSeptUserList(taskId: string, third_company_id: string, platform_id: string) {
    return this.select('*').where('task_id=? and third_company_id =? and platform_id =? and check_type =?', taskId, third_company_id, platform_id, CheckTypeEnum.ENABLE).query()
  }

  async pageQueryDeptUsers(startId: number, endId: number) {
    return this.select('*').where('id >=? and id <?', startId, endId).query()
  }

  async getDeptUerMinOrMaxId(taskId: string, third_company_id: string, platform_id: string, order: string) {
    let ret = await this.select('id').where('task_id=? and third_company_id =? and platform_id =?', taskId, third_company_id, platform_id).orderBy(`id ${order}`).limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return 0 as number
    }
    return ret[0].id
  }

  async getDeptUserMinOrMaxIdByMidTable(taskId: string, third_company_id: string, order: string) {
    let ret = await this.select('id').where('task_id=? and third_company_id =?', taskId, third_company_id).orderBy(`id ${order}`).limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return 0 as number
    }
    return ret[0].id
  }

  async getDeptUids(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
    const res = await this.select('uid').where('did =? and task_id =? and third_company_id =? and platform_id =?', did, taskId, thirdCompanyId, platformId).query()
    const ret: string[] = []
    for (const re of res) {
      ret.push(re.uid)
    }
    return ret
  }

  async cancelCheck(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
    await this.update({
      check_type: CheckTypeEnum.DISABLE
    }).where('did =? and task_id =? and third_company_id =? and platform_id =? and check_type = ?', did, taskId, thirdCompanyId, platformId, CheckTypeEnum.ENABLE).query()
  }

  async checkDeptUser(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
    await this.update({
      check_type: CheckTypeEnum.ENABLE
    }).where('did =? and task_id =? and third_company_id =? and platform_id =? and check_type = ?', did, taskId, thirdCompanyId, platformId, CheckTypeEnum.DISABLE).query()
  }

  async resetCheckType(taskId: string, thirdCompanyId: string, enable: boolean) {
    let update_check = CheckTypeEnum.DISABLE
    let condition_check = CheckTypeEnum.ENABLE
    if (enable) {
      update_check = CheckTypeEnum.ENABLE
      condition_check = CheckTypeEnum.DISABLE
    }
    await this.update({
      check_type: update_check
    }).where('task_id =? and third_company_id =? and check_type = ?', taskId, thirdCompanyId, condition_check).query()
  }

  async pageResetCheckType(startId: number, endId: number, enable: boolean) {
    let update_check = CheckTypeEnum.DISABLE
    if (enable) {
      update_check = CheckTypeEnum.ENABLE
    }

    await this.update({
      check_type: update_check
    }).where('id >=? and id <?', startId, endId).query()
  }

  async countDepartmentUserTaskData(taskId: string, thirdCompanyId: string) {
    return this.db.select('select count(1) as total from tb_las_department_user where task_id = ? and third_company_id = ?', [taskId, thirdCompanyId])
  }

  async addDeptUser(ovs: Partial<DepartmentUserSchema>): Promise<number> {
    return this.add(ovs).query()
  }
}
