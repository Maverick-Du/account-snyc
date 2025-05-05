import { Exception } from '../error'
import { IResult, Result } from './result'

export function verify(condistions: boolean, name: string, message?: string) {
  if (condistions) return
  throw new Exception(name, message)
}

export function assert(condistions: boolean, message?: string) {
  if (condistions) return
  throw new Exception('assertFailed', message)
}

export function e2r(error: any, code?: string) {
  if (error instanceof Error) {
    return new Result(code || error.name || 'error', error.message)
  }

  if (typeof error === 'string') {
    return new Result(code || 'error', error)
  }

  return new Result(code || 'error', JSON.stringify(error))
}

export function check(result: IResult, defaultCode: string = 'error') {
  if (result.code && result.code.toLocaleLowerCase() === 'ok') return

  if (result) {
    throw new Exception(result.code, result.message)
  }

  throw new Exception(defaultCode)
}
