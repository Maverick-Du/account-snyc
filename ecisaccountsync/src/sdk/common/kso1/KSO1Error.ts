export interface IKSO1Error<T = any> {
  status: number
  code: number
  message?: string
  data?: T
}

export class KSO1Error<T = any> implements IKSO1Error<T> {
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
