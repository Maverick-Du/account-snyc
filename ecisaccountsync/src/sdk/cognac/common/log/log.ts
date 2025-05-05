import { Logger, Level, Mode } from './Logger'
import ConsoleLogger from './ConsoleLogger'

let __logger: Logger = new ConsoleLogger()

export function d(...args: any[]) {
  __logger.log({
    level: Level.DEBUG,
    mode: Mode.LOCAL,
    args,
  })
}

export function debug(...args: any[]) {
  __logger.log({
    level: Level.DEBUG,
    mode: Mode.LOCAL,
    args,
  })
}

export function i(...args: any[]) {
  __logger.log({
    level: Level.INFO,
    mode: Mode.LOCAL,
    args,
  })
}

export function info(...args: any[]) {
  __logger.log({
    level: Level.INFO,
    mode: Mode.LOCAL,
    args,
  })
}

export function w(...args: any[]) {
  __logger.log({
    level: Level.WARNING,
    mode: Mode.LOCAL,
    args,
  })
}

export function warn(...args: any[]) {
  __logger.log({
    level: Level.WARNING,
    mode: Mode.LOCAL,
    args,
  })
}

export function e(...args: any[]) {
  __logger.log({
    level: Level.ERROR,
    mode: Mode.LOCAL,
    args,
  })
}

export function error(...args: any[]) {
  __logger.log({
    level: Level.ERROR,
    mode: Mode.LOCAL,
    args,
  })
}

export function rd(...args: any[]) {
  __logger.log({
    level: Level.DEBUG,
    mode: Mode.LOCAL,
    args,
  })
}

export function ri(...args: any[]) {
  __logger.log({
    level: Level.DEBUG,
    mode: Mode.REMOTE,
    args,
  })
}

export function rw(...args: any[]) {
  __logger.log({
    level: Level.DEBUG,
    mode: Mode.REMOTE,
    args,
  })
}

export function re(...args: any[]) {
  __logger.log({
    level: Level.DEBUG,
    mode: Mode.REMOTE,
    args,
  })
}

export function setLogger(logger: Logger) {
  __logger = logger
}

export function getLogger(): Logger {
  return __logger
}
