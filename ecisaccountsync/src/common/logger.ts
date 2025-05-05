import { log } from "../sdk/cognac/common";
import config from "./config";
import {newLogger} from "../sdk/cognac/server";


const logLevel = config.logLevel || 'info'
const logger = newLogger(config.appId, logLevel)
log.setLogger(logger as any)
