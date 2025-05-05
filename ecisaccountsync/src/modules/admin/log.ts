import { Context } from 'koa';
import { UAParser} from 'ua-parser-js'
import { LogDetail } from './type';
import audit from '../audit';
import { AdminOperationTypeEnum, LogType, OPERATION_MAP } from '../audit/type';
import { log } from '../../sdk/cognac/common';

export class LogService {
  private log = log
  private audit = audit
  private uaParser = new UAParser()

  public async logSuccess(ctx: Context, operatorType: AdminOperationTypeEnum, detail: string = '') {
    const operationTypeData = OPERATION_MAP.get(operatorType)
    const operationTime = new Date()
    const account = ctx.state.account
    const nickName = ctx.state.nickName
    const userId = ctx.state.userId
    const companyId = ctx.state.companyId
    const ip = this.getIp(ctx)
    const deviceInfo = this.getDeviceInfo(ctx)
    const logDetail: LogDetail = {
      companyId: companyId,
      operationTime: operationTime.toLocaleString(),
      operatorId: userId,
      operatorAccount: account,
      operatorName: nickName,
      operationType: operationTypeData.opKey,
      operationName: operationTypeData.opName,
      operationStatus: 'success',
      ip: ip,
      deviceInfo: deviceInfo,
      detail: detail
    }
    this.log.i({ info: JSON.stringify(logDetail) })
    // 添加成功审计日志
    const auditLog: LogType = {
      success: true,
      companyId: companyId,
      userId: userId,
      opKey: operationTypeData.opKey,
      opTime: operationTime.getTime(),
      ip: ip,
      detail: detail,
      deviceInfo: deviceInfo
    }
    await this.audit.auditLogWrite(auditLog)
  }

  public async logError(ctx: Context, operatorType: AdminOperationTypeEnum, err: Error, detail: string) {
    const operationTypeData = OPERATION_MAP.get(operatorType)
    const operationTime = new Date()
    const account = ctx.state.account
    const nickName = ctx.state.nickName
    const userId = ctx.state.userId
    const companyId = ctx.state.companyId
    const ip = this.getIp(ctx)
    const deviceInfo = this.getDeviceInfo(ctx)
    const logDetail: LogDetail = {
      companyId: companyId,
      operationTime: operationTime.toLocaleString(),
      operatorId: userId,
      operatorAccount: account,
      operatorName: nickName,
      operationType: operationTypeData.opKey,
      operationName: operationTypeData.opName,
      operationStatus: 'fail',
      ip: ip,
      deviceInfo: deviceInfo,
      detail: err.message
    }
    log.error({ message: JSON.stringify(logDetail) })
    // 添加失败审计日志
    const auditLog: LogType = {
      success: false,
      companyId: companyId,
      userId: userId,
      opKey: operationTypeData.opKey,
      opTime: operationTime.getTime(),
      ip: ip,
      detail: detail,
      deviceInfo: deviceInfo
    }
    await this.audit.auditLogWrite(auditLog)
  }

  private getIp(ctx: Context) {
    const ips =
      (ctx.req.headers['x-forwarded-for'] as string) ||
      (ctx.req.headers['X-Real-IP'] as string) ||
      (ctx.req.socket.remoteAddress.replace('::ffff:', '') as string);
    const ip = ips.split(',')?.[0];
    return ip.replace('::ffff:', '')
  }

  private getDeviceInfo(ctx: Context) {
    const userAgent = ctx.req.headers['user-agent'] as string
    if (!!userAgent) {
      const deviceInfo = this.uaParser.setUA(userAgent).getResult()
      log.i({ info: `deviceInfo: ${ JSON.stringify(deviceInfo) }` })
      return deviceInfo.device.type || ''
    }
    return ''
  }
}

export default new LogService()
