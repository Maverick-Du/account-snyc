import Koa, { Context } from 'koa'

import KoaLogger from 'koa-logger'
import KoaBody, { KoaBodyMiddlewareOptions } from 'koa-body'

import { log } from '../../common'

export interface Options {
    body?:Partial<KoaBodyMiddlewareOptions>
    logger?:any
}

export class Server {
  raw : Koa

  constructor() {
    this.raw = new Koa()
  }

  init(options:Options) {
    this.raw.use(KoaLogger(options.logger))
    this.raw.use(KoaBody(options.body))
    // 未捕获的Api异常
    this.raw.on('request-error', (error: Error, ctx: Context) => {
      log.e({
        type: 'request-error',
        message: error.message,
        requestId: ctx.requestId
      })
    })

    // 未捕获的服务异常
    this.raw.on('server-error', (error: any) => {
      log.e({
        type: 'server-error',
        message: error.message
      })
    })
  }

  use(middleware:Koa.Middleware) {
    return this.raw.use(middleware)
  }

  start(port?:number) {
    // eslint-disable-next-line promise/param-names
    return new Promise((resovle, reject) => {
      this.raw.listen(port, () => {
        log.i('server started, listening at ' + port)
        resovle('')
      })
    })
  }
}
