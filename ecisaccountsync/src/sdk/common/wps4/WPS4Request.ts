import axios, { AxiosError } from 'axios'
import * as https from 'https'
import { WPS4Context } from './WPS4Context'
import { WPS4Error } from './WPS4Error'
import { WPS4Result } from './WPS4Result'
import {sleep} from "../../../common/util";
import config from "../../../common/config";
import { log } from '../../cognac/common'

const agent = new https.Agent({ rejectUnauthorized: true })

// 定义重试请求函数
async function retryRequest(url: string, config: any, retryCount: any) {
  try {
    log.i({ info: `http axios retryRequest start. retryCount: ${retryCount}` })
    // 发起重试请求
    await sleep(1000)
    return await axios(config);
  } catch (error) {
    retryCount--;
    if (retryCount > 0) {
      return retryRequest(url, config, retryCount);
    }
    return new CustomAxiosError(url, error)
  }
}

export interface WPS4Params {
  [key: string]: any
}

export interface WPS4Header {
  [key: string]: any
}

export class CustomAxiosError extends TypeError{
  message: string
  request: {
    url: string
    method: string
    headers: any
    data: any
  }
  response: {
    status: number
    statusText: string
    x_request_id: string
    data: any
  }
  stack: any

  constructor(url : string, error: AxiosError) {
    let response_data = error.response?.data
    let message = response_data ? `${error.message},${JSON.stringify(response_data)}` : error.message
    super(message)
    this.message = message
    this.request = {
      url: url,
      method: error.config?.method,
      headers: error.config?.headers,
      data: error.config?.data,
    }
    this.response = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      x_request_id: error.response?.headers ? error.response?.headers["x-request-id"] : null,
      data: response_data,
    }
    this.stack = error.stack
  }
}

export class WPS4Request {
  ctx: WPS4Context
  headers: WPS4Header = {}

  constructor(ctx: WPS4Context) {
    this.ctx = ctx
    this.headers = ctx.defaultHeaders
  }

  private WPS4Error(error: AxiosError) {
    if (error.response) {
      const status = error.response.status || 500
      let { code, msg }: any = error.response.data
      code = code || 1
      msg = msg || 'serverError'
      throw new WPS4Error(status, code, msg, error)
    }
    const message = error.message || 'error'
    return new WPS4Error(500, 1, message, error)
  }

  async convertError(url: string, error: any) {
    if (error instanceof AxiosError) {
      error = error as AxiosError
      if (error.response) {
        let code = error.response.data?.code
        if (error.response.status === 502 || config.httpRetryCode.indexOf(code) >= 0) {
          // 设置重试次数
          let retryCount = 3;
          // 重试请求
          log.i({ info: `http axios retryRequest start. data: ${JSON.stringify(error.response.data)}` })
          return retryRequest(url, error.response.config, retryCount);
        }
      }
      return new CustomAxiosError(url, error)
    } else {
      return error
    }
  }

  async get<T extends WPS4Result = { code: 0 }>(
    url: string,
    params?: WPS4Params
  ) {
    url = this.query(url, params)
    const sign = this.ctx.sign('GET', url)
    url = this.ctx.abs(url)

    try {
      const ret = await axios.get(url, {
        headers: { ...this.headers, ...sign },
        httpsAgent: agent
      })
      return ret.data as T
    } catch (error) {
      let res = await this.convertError(url, error)
      if (res.status == 200) {
        return res.data as T
      } else {
        throw res
      }
    }
  }

  async post<T extends WPS4Result = { code: 0 }>(
    url: string,
    params?: WPS4Params,
    data = {}
  ) {
    url = this.query(url, params)
    const body = this.ctx.stringify(data)
    const sign = this.ctx.sign('POST', url, body)
    url = this.ctx.abs(url)

    try {
      const ret = await axios.post(url, body, {
        headers: { ...this.headers, ...sign },
        httpsAgent: agent
      })
      return ret.data as T
    } catch (error) {
      let res = await this.convertError(url, error)
      if (res.status == 200) {
        return res.data as T
      } else {
        throw res
      }
    }
  }

  async put<T extends WPS4Result = { code: 0 }>(
    url: string,
    params?: WPS4Params,
    data = {}
  ) {
    url = this.query(url, params)
    const body = this.ctx.stringify(data)
    const sign = this.ctx.sign('PUT', url, body)
    url = this.ctx.abs(url)

    try {
      const ret = await axios.put(url, body, {
        headers: { ...this.headers, ...sign },
        httpsAgent: agent
      })
      return ret.data as T
    } catch (error) {
      let res = await this.convertError(url, error)
      if (res.status == 200) {
        return res.data as T
      } else {
        throw res
      }
    }
  }

  async delete<T extends WPS4Result = { code: 0 }>(
    url: string,
    params?: WPS4Params
  ) {
    url = this.query(url, params)
    const sign = this.ctx.sign('DELETE', url)
    url = this.ctx.abs(url)

    try {
      const ret = await axios.delete(url, {
        headers: { ...this.headers, ...sign },
        httpsAgent: agent
      })
      return ret.data as T
    } catch (error) {
      let res = await this.convertError(url, error)
      if (res.status == 200) {
        return res.data as T
      } else {
        throw res
      }
    }
  }

  private query(url: string, params: WPS4Params) {
    const query = this.ctx.query(params)
    if (url.indexOf('?') > 0) {
      return `${url}&${query}`
    }
    if (query && query.length > 0) {
      return `${url}?${query}`
    }
    return url
  }
}
