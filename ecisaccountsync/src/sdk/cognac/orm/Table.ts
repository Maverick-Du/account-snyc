import { check, verify } from '../common'
import { IDatabase } from './Database'
import { Delete, Insert, Select, Update } from './Query'

export class Table<TSchema> {
  readonly db: IDatabase
  readonly name: string

  constructor(db: IDatabase, name: string) {
    this.db = db
    this.name = name
  }

  add(ovs:Partial<TSchema>): TableAdd<TSchema> {
    return new TableAdd<TSchema>(this, ovs)
  }

  remove(caluse:string, ...values:any[]): TableRemove<TSchema> {
    return new TableRemove<TSchema>(this, caluse, values)
  }

  update(ovs: Partial<TSchema>): TableUpdate<TSchema> {
    return new TableUpdate<TSchema>(this, ovs)
  }

  get(caluse:string, ...values:any[]): TableGet<TSchema> {
    return new TableGet<TSchema>(this, ['*']).where(caluse, ...values)
  }

  find(caluse:string, ...values:any[]) : TableSelect<TSchema> {
    return this.select('*').where(caluse, ...values)
  }

  delete(): TableDelete<TSchema> {
    return new TableDelete<TSchema>(this)
  }

  select(...columns: string[]): TableSelect<TSchema> {
    return new TableSelect<TSchema>(this, columns)
  }

  static columns(keys: string[]) {
    return keys.map(x => `\`${x}\``)
  }

  static single<T>(rows: any[]): T {
    return (rows && rows.length > 0 ? rows[0] : null) as T
  }

  static array<T>(rows: any[]): T[] {
    return (rows && rows.length > 0 ? rows : []) as T[]
  }
}

export class TableGet<TSchema> {
  table: Table<TSchema>
  sql:Select
  constructor(table: Table<TSchema>, columns: string[]) {
    this.table = table
    this.sql = new Select(columns)
    this.sql.from(table.name)
  }

  where(clause:string, ...values:any[]) {
    this.sql.where(clause, ...values)
    return this
  }

  async query<T = TSchema>(): Promise<T> {
    const ret = await this.sql.exec(this.table.db)
    check(ret)
    return Table.single<T>(ret.data.rows)
  }
}

export class TableSelect<TSchema> {
  table: Table<TSchema>
  sql:Select
  constructor(table: Table<TSchema>, columns: string[]) {
    this.table = table
    this.sql = new Select(columns)
    this.sql.from(table.name)
  }

  where(clause:string, ...values:any[]) {
    this.sql.where(clause, ...values)
    return this
  }

  limit(limit:number, offset:number) {
    this.sql.limit(limit, offset)
    return this
  }

  orderBy(...orders:string[]) {
    this.sql.orderBy(...orders)
    return this
  }

  groupBy(...groups:string[]) {
    this.sql.groupBy(...groups)
    return this
  }

  async query<T = TSchema>(): Promise<T[]> {
    const ret = await this.sql.exec(this.table.db)
    check(ret)
    return Table.array<T>(ret.data.rows)
  }
}

export class TableUpdate<TSchema> {
  table: Table<TSchema>
  sql:Update
  constructor(table: Table<TSchema>, ovs: Partial<TSchema>) {
    this.table = table
    this.sql = new Update(table.name)
    this.set(ovs)
  }

  private set(ovs: Partial<TSchema>) {
    const keys = Object.keys(ovs)
    const values = Object.values(ovs)
    const columns = Table.columns(keys)
    this.sql.set(columns, values)
    return this
  }

  where(caluse:string, ...values:any[]) {
    this.sql.where(caluse, ...values)
    return this
  }

  async query(): Promise<string> {
    const ret = await this.sql.exec(this.table.db)
    check(ret)
    return ret.data.affect
  }
}

export class TableAdd<TSchema> {
  table: Table<TSchema>
  sql:Insert
  constructor(table: Table<TSchema>, ovs: Partial<TSchema>) {
    this.table = table
    this.sql = new Insert()
    this.add(ovs)
  }

  private add(ovs: Partial<TSchema>) {
    const keys = Object.keys(ovs)
    const values = Object.values(ovs)
    const columns = Table.columns(keys)
    this.sql.into(this.table.name, columns, values)
    return this
  }

  async query<T=number>(): Promise<T> {
    const ret = await this.sql.exec(this.table.db)
    check(ret)
    return ret.data.affect as T
  }
}

export class TableRemove<TSchema> {
  table: Table<TSchema>
  sql:Delete

  constructor(table: Table<TSchema>, caluse:string, values:any[]) {
    this.table = table
    this.sql = new Delete()
    this.sql.from(table.name).where(caluse, ...values)
  }

  async query(): Promise<string> {
    const ret = await this.sql.exec(this.table.db)
    check(ret)
    return ret.data.affect
  }
}

export class TableDelete<TSchema> {
  table: Table<TSchema>
  sql:Delete

  constructor(table: Table<TSchema>) {
    this.table = table
    this.sql = new Delete()
    this.sql.from(table.name)
  }

  where(caluse:string, ...values:any[]) {
    this.sql.where(caluse, ...values)
  }

  async query(): Promise<string> {
    const ret = await this.sql.exec(this.table.db)
    check(ret)
    return ret.data.affect
  }
}
