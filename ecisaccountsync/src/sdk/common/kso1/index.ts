import {KSO1Error} from "./KSO1Error";
import {KSO1Result} from "./KSO1Result";

export * from './KSO1Context'
export * from './KSO1Request'
export * from './KSO1Result'
export * from './KSO1Error'

export default class KSO1 {
  static check(result: KSO1Result) {
    if (result.code === 0) return

    throw new KSO1Error(200, result.code, result.msg)
  }

  static verify(conditions: boolean, code: number, message?: string) {
    if (conditions) return

    throw new KSO1Error(200, code, message)
  }
}
