/* eslint-disable camelcase */
import {IDatabase, Table} from '../../../../cognac/orm'
import {CheckTypeEnum} from "../types";

export class DepartmentSchema {
  id:number
  did: string
  pid: string
  task_id: string
  third_company_id: string
  platform_id: string
  name: string
  source: string
  type: string
  check_type: CheckTypeEnum
  order: number
  ctime: number
  mtime: number
}

export class LASDepartmentTable extends Table<DepartmentSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_las_department')
  }

  async getRoot(
      taskId: string,
      thirdCompanyId: string,
      pid: string
  ): Promise<DepartmentSchema[]> {
    return this.select('*').where('pid=? AND task_id = ? and third_company_id =?', pid, taskId, thirdCompanyId).query()
  }

  async getById(taskId: string, thirdCompanyId: string, platform_id: string, did: string): Promise<DepartmentSchema> {
    return this.get('did=? and task_id =? and third_company_id =? and platform_id =? and check_type =?', did, taskId, thirdCompanyId, platform_id, CheckTypeEnum.ENABLE).query()
  }

  async getByIds(taskId: string, thirdCompanyId: string, platform_id: string, dids: string[]): Promise<DepartmentSchema[]> {
    return this.select('*').where('did in (?) and task_id =? and third_company_id =? and platform_id =? and check_type =?', dids, taskId, thirdCompanyId, platform_id, CheckTypeEnum.ENABLE).query()
  }

  async listAllDepartments(
    taskId: string,
    thirdCompanyId: string,
    platform_id: string,
    offset: number,
    limit: number
  ): Promise<DepartmentSchema[]> {
    const sql = this.select('*').where('task_id = ? and third_company_id =? and platform_id =? and check_type =?', taskId, thirdCompanyId, platform_id, CheckTypeEnum.ENABLE)
    if (limit > 0) sql.limit(limit, offset)
    return sql.query()
  }

  async listByParentId(
    taskId: string,
    thirdCompanyId: string,
    platform_id: string,
    pid: string,
    offset: number,
    limit: number
  ): Promise<DepartmentSchema[]> {
    const sql = this.select('*').where('pid=? AND task_id = ? and third_company_id =? and platform_id=? and check_type =? order by `order` desc', pid, taskId, thirdCompanyId, platform_id, CheckTypeEnum.ENABLE)
    if (limit > 0) sql.limit(limit, offset)
    return sql.query()
  }

  async pageQueryDepts(startId: number, endId: number) {
    return this.select('*').where('id >=? and id <?', startId, endId).query()
  }

  async getDeptMinOrMaxId(taskId: string, third_company_id: string, platform_id: string, order: string) {
    let ret = await this.select('id').where('task_id=? and third_company_id =? and platform_id =?', taskId, third_company_id, platform_id).orderBy(`id ${order}`).limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return 0 as number
    }
    return ret[0].id
  }

  async getDeptMinOrMaxIdByAnalyse(taskId: string, third_company_id: string, order: string) {
    let ret = await this.select('id').where('task_id=? and third_company_id =? and check_type =?', taskId, third_company_id, CheckTypeEnum.ENABLE).orderBy(`id ${order}`).limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return 0 as number
    }
    return ret[0].id
  }

  async getDeptMinOrMaxIdByMidTable(taskId: string, third_company_id: string, order: string) {
    let ret = await this.select('id').where('task_id=? and third_company_id =?', taskId, third_company_id).orderBy(`id ${order}`).limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return 0 as number
    }
    return ret[0].id
  }

  async cancelCheck(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
    await this.update({
      check_type: CheckTypeEnum.DISABLE
    }).where('did =? and task_id =? and third_company_id =? and platform_id =? and check_type = ?', did, taskId, thirdCompanyId, platformId, CheckTypeEnum.ENABLE).query()
  }

  async checkDept(taskId: string, thirdCompanyId: string, platformId: string, did: string) {
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

  async getDistinctTaskId(): Promise<string[]> {
    const ret: string[] = []
    const res = await this.select('distinct task_id').orderBy('task_id ASC').query()
    for (const re of res) {
      ret.push(re.task_id)
    }
    return ret
  }

  async deleteByTaskId(taskId: string): Promise<void> {
    await this.remove('task_id =?', taskId).query()
  }

  async countTaskData(taskId: string, third_company_id: string, check_type?: CheckTypeEnum) {
    let sql = 'select count(1) as total from tb_las_department where task_id=? and third_company_id =?'
    let arr: any[] = [taskId, third_company_id]
    if (check_type) {
      sql = `${sql} and check_type =?`
      arr.push(check_type)
    }
    return this.db.select(sql, arr)
  }

  async countData() {
    return this.db.select('select count(1) as total from tb_las_department', [])
  }

  async getByIdNoCheck(taskId: string, thirdCompanyId: string, platform_id: string, did: string): Promise<DepartmentSchema> {
    return this.get('did=? and task_id =? and third_company_id =? and platform_id =?', did, taskId, thirdCompanyId, platform_id).query()
  }

  async getByIdsNoCheck(taskId: string, thirdCompanyId: string, platform_id: string, dids: string[]): Promise<DepartmentSchema[]> {
    return this.select('*').where('did in (?) and task_id =? and third_company_id =? and platform_id =?', dids, taskId, thirdCompanyId, platform_id).query()
  }

  async listByParentIdNoCheck(
      taskId: string,
      thirdCompanyId: string,
      platform_id: string,
      pid: string,
      offset: number,
      limit: number
  ): Promise<DepartmentSchema[]> {
    const sql = this.select('*').where('pid=? AND task_id = ? and third_company_id =? and platform_id=? order by `order` desc', pid, taskId, thirdCompanyId, platform_id)
    if (limit > 0) sql.limit(limit, offset)
    return sql.query()
  }

  async countDepartmentTaskData(taskId: string, thirdCompanyId: string) {
    return this.db.select('select count(1) as total from tb_las_department where task_id = ? and third_company_id = ?', [taskId, thirdCompanyId])
  }

  async addDept(ovs: Partial<DepartmentSchema>): Promise<number> {
    return this.add(ovs).query()
  }
}
