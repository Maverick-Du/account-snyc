export interface IWPS4Error<T = any> {
  status: number
  code: number
  message?: string
  data?: T
}

export class WPS4Error<T = any> implements IWPS4Error<T> {
  status: number
  code: number
  message?: string
  data?: T

  constructor(status: number, code: number, message?: string, data?: T) {
    this.status = status
    this.code = code
    this.message = message
    this.data = data
  }
}
