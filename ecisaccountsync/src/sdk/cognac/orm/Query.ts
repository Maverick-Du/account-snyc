import { DeleteResult, IDatabase, InsertResult, SelectResult, UpdateResult } from './Database'

export class Query {
  protected sql:string[]
  protected values:any[]

  constructor(sql:string[] = [], values:any[] = []) {
    this.sql = sql
    this.values = values
  }

  static select(...columns:string[]):Select {
    return new Select(columns)
  }

  static insert():Insert {
    return new Insert()
  }

  static update(table:string):Update {
    return new Update(table)
  }

  static delete(): Delete {
    return new Delete()
  }
}

export class Insert extends Query {
  constructor() {
    super(['INSERT'])
  }

  into(table:string, columns:string[], values:any[]) {
    this.sql.push('INTO', table)
    this.sql.push('(', columns.join(','), ')')
    this.sql.push('VALUES')
    this.sql.push('(', columns.map(x => '?').join(','), ')')
    this.values.push(...values)
    return this
  }

  exec(db:IDatabase):Promise<InsertResult> {
    return db.insert(this.sql.join(' '), this.values)
  }
}

export class Delete extends Query {
  constructor() {
    super(['DELETE'])
  }

  from(...tables:string[]) {
    this.sql.push('FROM', ...tables)
    return this
  }

  where(clause:string, ...values:any[]) {
    this.sql.push('WHERE', clause)
    this.values.push(...values)
    return this
  }

  exec(db:IDatabase):Promise<DeleteResult> {
    return db.delete(this.sql.join(' '), this.values)
  }
}

export class LeftJoin {
  sql:string[]
  constructor(lTable:string, rTable:string, on:string) {
    this.sql = [lTable, 'LEFT JOIN', rTable, 'ON', on]
  }

  value() {
    return this.sql.join(' ')
  }
}

export class Select extends Query {
  constructor(columns:string[]) {
    super(['SELECT', columns.join(',')])
  }

  from(...tables:string[]) {
    this.sql.push('FROM', ...tables)
    return this
  }

  where(clause:string, ...values:any[]) {
    this.sql.push('WHERE', clause)
    this.values.push(...values)
    return this
  }

  limit(limit:number, offset:number) {
    this.sql.push('LIMIT', '?', 'OFFSET', '?')
    this.values.push(limit, offset)
    return this
  }

  orderBy(...orders:string[]) {
    this.sql.push('ORDER BY', ...orders)
    return this
  }

  groupBy(...groups:string[]) {
    this.sql.push('GROUP BY', ...groups)
    return this
  }

  exec(db:IDatabase):Promise<SelectResult> {
    return db.select(this.sql.join(' '), this.values)
  }
}

export class Update extends Query {
  constructor(table:string) {
    super(['UPDATE', table])
  }

  set(columns:string[], values:any[]) {
    this.sql.push('SET', columns.map(x => `${x}=?`).join(','))
    this.values.push(...values)
    return this
  }

  where(clause:string, ...values:any[]) {
    this.sql.push('WHERE', clause)
    this.values.push(...values)
    return this
  }

  exec(db:IDatabase):Promise<UpdateResult> {
    return db.update(this.sql.join(' '), this.values)
  }
}
