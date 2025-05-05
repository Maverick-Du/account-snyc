/* eslint-disable camelcase */
import {IDatabase, Table } from "../../../sdk/cognac/orm"

export interface RootDeptUserTempSchema {
  id: number
  company_id: string
  uid: string
  ctime: number
  mtime: number
}

export class RootDeptUserTempTable extends Table<RootDeptUserTempSchema> {
  constructor(db: IDatabase) {
    super(db, 'tb_root_dept_user_temp')
  }

  async getRootUserTemp(company_id: string, uid: string): Promise<RootDeptUserTempSchema> {
    return this.get('company_id=? and uid=?', company_id, uid).query()
  }

  async deleteRootUserTemp(company_id: string, uid: string) {
    return this.remove('company_id=? and uid=?', company_id, uid).query()
  }

  async addRootUserTemp(ovs: Partial<RootDeptUserTempSchema>): Promise<number> {
    return this.add(ovs).query()
  }

}
