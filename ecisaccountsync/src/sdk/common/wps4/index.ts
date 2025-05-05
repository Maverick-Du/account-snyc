import { WPS4Error } from './WPS4Error'
import { WPS4Result } from './WPS4Result'

export * from './WPS4Context'
export * from './WPS4Request'
export * from './WPS4Result'
export * from './WPS4Error'

export default class WPS4 {
  static check(result: WPS4Result) {
    if (result.code === 20000000) return

    throw new WPS4Error(200, result.code, result.msg)
  }

  static verify(conditions: boolean, code: number, message?: string) {
    if (conditions) return

    throw new WPS4Error(200, code, message)
  }
}
