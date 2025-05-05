/* eslint-disable camelcase */
import {CheckTypeEnum} from "../types";
import {IDatabase, Table} from "../../../../cognac/orm";

export interface UserSchema {
  id:number
  uid: string
  task_id: string
  third_company_id: string
  platform_id: string,
  account:string, // 登录名，对应account
  nick_name :string, // 用户昵称，对应nick_name
  password :string, // 密码
  // role: string, // 成员角色， 预留
  def_did: string,
  def_did_order: number

  avatar :string, // 头像
  email :string, // 邮箱
  gender :string, // 用户性别
  title :string, // 职称
  work_place :string, // 办公地点
  leader :string, // 上级主管ID
  employer :string, // 员工工号
  employment_status :string, // 就职状态[active, notactive, dismission, disabled]
  employment_type :string, // 就职类型[permanent, intern]
  phone :string, // 手机号
  telephone :string, // 座机号
  check_type: CheckTypeEnum
  ctime :number,
  mtime :number,
  source: string
  custom_fields :string, // 自定义字段
}

export interface DeptMemberJoinSchema extends UserSchema {
  main : number
  order: number
}

export class LASUserTable extends Table<UserSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_las_user')
  }

  // async getByUserId(taskId: string, platformId: string, uid: string): Promise<UserSchema> {
  //   return await this.get('uid=? and task_id =? and platform_id =? and check_type =?', uid, taskId, platformId, CheckTypeEnum.ENABLE).query()
  // }
  //
  // async batchGetByUserIds(taskId: string, platformId: string, ids: string[]): Promise<UserSchema[]> {
  //   return await this.select('*')
  //     .where('uid in (?) and task_id =? and platform_id =?', ids, taskId, platformId)
  //     .query()
  // }

  // async getAllUsers(taskId: string, third_company_id: string, platform_id: string, offset: number, limit: number): Promise<UserSchema[]> {
  //   const sql = this.select('*').where('task_id =? and third_company_id =? and platform_id=? and check_type =?', taskId, third_company_id, platform_id, CheckTypeEnum.ENABLE)
  //   if (limit > 0) sql.limit(limit, offset)
  //   return await sql.query()
  // }

  // 通过id分页查询用户
  async getUsersById(start: number, end: number): Promise<UserSchema[]> {
    const sql = this.select('*').where('id >= ? and id < ?', start, end);

    return await sql.query();
  }

  async getNoDeptUsers(taskId: string, thirdCompanyId: string, platformId: string) {
    let res = await this.db.select('select u.uid from tb_las_user u left join tb_las_department_user du on u.uid = du.uid where du.uid is null and u.task_id =? and u.third_company_id =? and u.platform_id =?', [taskId, thirdCompanyId, platformId])
    let rows: any[] = Table.array(res.data.rows)
    return rows.map(x => x.uid as string)
  }

  async getUsersByUids(taskId: string, platformId: string, uids: string[]) {
    return this.select('*').where('uid in (?) and task_id =? and platform_id=? and check_type =?', uids, taskId, platformId, CheckTypeEnum.ENABLE).query()
  }

  async cancelCheck(taskId: string, thirdCompanyId: string, platformId: string, uids: string[]) {
    await this.update({
      check_type: CheckTypeEnum.DISABLE
    }).where('uid in (?) and task_id =? and third_company_id =? and platform_id =? and check_type = ?', uids, taskId, thirdCompanyId, platformId, CheckTypeEnum.ENABLE).query()
  }

  async checkUsers(taskId: string, thirdCompanyId: string, platformId: string, uids: string[]) {
    await this.update({
      check_type: CheckTypeEnum.ENABLE
    }).where('uid in (?) and task_id =? and platform_id =? and check_type = ?', uids, taskId, platformId, CheckTypeEnum.DISABLE).query()
  }

  async getTaskMinId(taskId: string, thirdCompanyId: string) {
    let ret = await this.select('id').where('task_id =? and third_company_id =?', taskId, thirdCompanyId).orderBy('id ASC').limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return null
    }
    return ret[0].id
  }

  async getTaskMaxId(taskId: string, thirdCompanyId: string) {
    let ret = await this.select('id').where('task_id =? and third_company_id =?', taskId, thirdCompanyId).orderBy('id DESC').limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return null
    }
    return ret[0].id
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

  async deleteByTaskId(taskId: string): Promise<void> {
    await this.remove('task_id =?', taskId).query()
  }

  async countTaskData(taskId: string, third_company_id: string, check_type?: CheckTypeEnum) {
    let sql = 'select count(1) as total from tb_las_user where task_id=? and third_company_id =?'
    let arr: any[] = [taskId, third_company_id]
    if (check_type) {
      sql = `${sql} and check_type =?`
      arr.push(check_type)
    }

    return this.db.select(sql, arr)
  }

  async countData() {
    return this.db.select('select count(1) as total from tb_las_user', [])
  }

  async countUserTaskData(taskId: string, thirdCompanyId: string) {
    return this.db.select('select count(1) as total from tb_las_user where task_id = ? and third_company_id = ?', [taskId, thirdCompanyId])
  }

  async addUser(ovs: Partial<UserSchema>): Promise<number> {
    return this.add(ovs).query()
  }

  async getUserMinOrMaxIdByMidTable(taskId: string, third_company_id: string, order: string) {
    let ret = await this.select('id').where('task_id=? and third_company_id =?', taskId, third_company_id).orderBy(`id ${order}`).limit(1, 0).query()
    if (!ret || ret.length <= 0) {
      return 0 as number
    }
    return ret[0].id
  }

}
