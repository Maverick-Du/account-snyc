import * as crypto from 'crypto'
import * as qs from 'querystring'
import {KSO1Params} from "./KSO1Request";

export class KSO1Context {
  host: string
  appId: string
  appKey: string
  defaultHeaders: { [key: string]: string }
  isMultiTenant: boolean


  constructor(host: string, appId: string, appKey: string) {
    this.host = host
    this.appId = appId
    this.appKey = appKey
    this.defaultHeaders = {}
    this.isMultiTenant = false
  }

  abs(url: string) {
    if (url.indexOf('http') >= 0) {
      return url
    }
    return `${this.host}${url}`
  }

  sha1(content: string) {
    const sha1 = crypto.createHash('sha1')
    return sha1.update(content).digest('hex')
  }

  sha256(content: string) {
    const sha256 = crypto.createHash('sha256')
    return sha256.update(content).digest('hex')
  }

  hmacSha256(content: string) {
    const sha256 = crypto.createHmac('sha256', this.appKey)
    return sha256.update(content).digest('hex')
  }

  md5(content: string) {
    const md5 = crypto.createHash('md5')
    return md5.update(content).digest('hex')
  }

  query(params:KSO1Params) {
    params = this.removeUndefinedOrNullParams(params)
    return qs.stringify(params)
  }

  stringify(params:KSO1Params) {
    params = this.removeUndefinedOrNullParams(params)
    return JSON.stringify(params)
  }

  private removeUndefinedOrNullParams(params:KSO1Params) {
    const values:KSO1Params = {}
    for (const k of Object.keys(params)) {
      const v = params[k]
      if (typeof v === 'undefined' || v == null) { continue }
      values[k] = v
    }
    return values
  }

  sign(
    method: string,
    url: string,
    body: string = '',
    contentType: string = 'application/json'
  ) {
    const ver = 'KSO-1'
    const date = new Date().toUTCString()
    let sha256 = ''
    if (body !== '') {
      sha256 = this.sha256(body)
    }
    const signStr = `${ver}${method}${url}${contentType}${date}${sha256}`
    const sign = this.hmacSha256(signStr)
    const auth = `${ver} ${this.appId}:${sign}`

    return {
      'Content-Type': contentType,
      'X-Kso-Date': date,
      'X-Kso-Authorization': auth
    }
  }
}
