import { Logger as WLogger, createLogger, format, transports } from 'winston'
import {Level, Logger, Options} from "../../common";
const { combine, timestamp, colorize, errors, splat, json } = format

class WinstonLogger implements Logger {
  raw:WLogger
  fun:{[key:number]:Function}
  constructor(appId:string, level:string) {
    this.raw = createLogger({
      format: combine(
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        errors({ stack: true }),
        splat(),
        json(),
        colorize({ all: true })
      ),
      defaultMeta: { appid: appId },
      transports: [
        new transports.Console({
          level
        })
      ]
    })
    this.fun = {}
    this.fun[Level.INFO] = this.raw.info
    this.fun[Level.DEBUG] = this.raw.debug
    this.fun[Level.WARNING] = this.raw.warn
    this.fun[Level.ERROR] = this.raw.error
    this.fun[Level.FATAL] = this.raw.error
  }

  log(options:Options): void {
    const func = this.fun[options.level]
    return func(...options.args)
  }

  winston() {
    return this.raw
  }
}

export function newLogger(appid: string, logLevel: string) {
  return new WinstonLogger(appid, logLevel)
}
