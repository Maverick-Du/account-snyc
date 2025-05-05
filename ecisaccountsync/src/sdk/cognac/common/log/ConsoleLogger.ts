import { Logger, Options } from "./Logger";

export default class ConsoleLogger implements Logger {
  log(options:Options): void {
    let { level, args } = options;
    console.log(`[${(new Date()).toISOString()}][${level}]:`, JSON.stringify(args))
  }
}