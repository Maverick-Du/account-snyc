export interface IResult {
  code: string
  message?: string
}

export class Result<T = any> implements IResult {
  code: string
  message: string
  data?: T
  constructor(code: string, message?: string, data?: T) {
    this.code = code
    this.message = message
    this.data = data
  }
}
