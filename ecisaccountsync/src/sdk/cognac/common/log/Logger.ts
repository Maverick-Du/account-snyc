export enum Level {
  INFO = 0,
  DEBUG = 1,
  WARNING = 2,
  ERROR = 3,
  FATAL = 4
}

export enum Mode {
  LOCAL = 0,
  REMOTE = 1
}

export interface Options {
  level:Level
  mode:Mode
  action?:string

  args?:any[]
}

export interface Logger {
  log(options: Options): void
}