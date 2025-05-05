import { Exception } from './exception'

export class ServerError extends Exception {
  status: number
  constructor(name: string, message?: string, status: number = 500) {
    super(name, message)
    this.status = status
  }
}

export class NotFound extends ServerError {
  constructor(name: string, message?: string) {
    super(name, message, 404)
  }
}

export class AccessDenied extends ServerError {
  constructor(name: string, message?: string) {
    super(name, message, 403)
  }
}
