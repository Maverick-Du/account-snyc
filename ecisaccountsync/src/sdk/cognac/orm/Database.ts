import { IResult } from '../common'

export interface SelectResult extends IResult {
  data: { rows: any[] }
}
export interface UpdateResult extends IResult {
  data: { affect: any }
}
export interface InsertResult extends IResult {
  data: { affect: any }
}

export interface DeleteResult extends IResult {
  data: { affect: any }
}

export interface IDatabase {
  select(sql: string, values: any[]): Promise<SelectResult>
  update(sql: string, values: any[]): Promise<UpdateResult>
  insert(sql: string, values: any[]): Promise<InsertResult>
  delete(sql: string, values: any[]): Promise<DeleteResult>
}
