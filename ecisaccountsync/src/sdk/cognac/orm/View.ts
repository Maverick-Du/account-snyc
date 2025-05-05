import { IDatabase } from './Database'

export class View {
  db: IDatabase

  constructor(db: IDatabase) {
    this.db = db
  }

  protected single<T>(rows: any[]): T {
    return (rows && rows.length > 0 ? rows[0] : null) as T
  }

  protected array<T>(rows: any[]): T[] {
    return (rows && rows.length > 0 ? rows : []) as T[]
  }
}
