import docmini from "../../common/docmini";
import { AuditLogType, AuditOpType, AuditScriptsType, PlatformType } from "../../common/type";
import { AdminOperationTypeEnum, BaseOpTypeEnum, LogType, OperationTypeSort, ROOT_OPERATION_KEY, OPERATION_MAP } from "./type";
import config from "../../common/config";
import { log } from "../../sdk/cognac/common";

class Audit {
  private docmini = docmini
  private rootOpType: BaseOpTypeEnum = ROOT_OPERATION_KEY as BaseOpTypeEnum

  public async init() {
    // 模块初始化 添加 审计日志类型 审计日志脚本
    const auditScripts = this.getAuditScripts()
    const auditLogTypes = this.getAuditLogTypes()

    try {
      log.info({info: "audit init start..."})
      await this.docmini.auditOpTypeSet(auditLogTypes)
      await this.docmini.auditScriptsSet(auditScripts)
      log.info({info: "audit init success..."})
    } catch (error) {
      const response = error?.response
      if (response && response.data?.code === 40100001) {
        // 应用还未注册， 轮询请求，请求成功，取消轮询
        setTimeout(() => {
          this.init()
        }, 4000)
      } else {
        error.msg = "audit init throw error"
        log.e(error)
      }
    }
  }

  public async auditLogWrite(log: LogType) {
    const currentOpType = OPERATION_MAP.get(log.opKey as AdminOperationTypeEnum)
    const auditLog: AuditLogType = {
      result: {
        success: log.success
      },
      what: {
        log_category: this.rootOpType,
        meta_data: JSON.stringify({ detail: log.detail }),
        op_key: `${this.rootOpType}.${currentOpType.pOpKey}.${currentOpType.opKey}`
      },
      when: {
        op_time: Math.floor(log.opTime / 1000)   // 秒级时间
      },
      where: {
        app_id: config.appId,
        app_name: config.appName,
        device_info: log.deviceInfo,
        ip_addr: log.ip,
        platform_type: PlatformType.third_party_app
      },
      who: {
        comp_id: log.companyId,
        operator_id: log.userId
      }
    }
    return await this.docmini.auditLogsWrite(auditLog)
  }

  private getAuditScripts(): AuditScriptsType[] {
    const script = `
      function parser(metaData) {
        const myObj = JSON.parse(metaData)
        let detail = myObj.detail
        return {
          detail: detail
        }
      }
    `
    let auditScripts: AuditScriptsType[] = []
    OPERATION_MAP.forEach(item => {
      if (item.opType !== OperationTypeSort.first) {
        auditScripts.push({
          op_key: `${this.rootOpType}.${item.pOpKey}.${item.opKey}`,
          script: script
        })
      }
    })

    return auditScripts
  }

  private getAuditLogTypes(): AuditOpType[] {
    let opTypes: AuditOpType[] = []
    for (const opType of OPERATION_MAP.values()) {
      if (opType.opType === OperationTypeSort.first) {
        opTypes.push({
          op_key: `${opType.pOpKey}.${opType.opKey}`,
          op_value: opType.opName,
          p_op_key: opType.pOpKey
        })
      } else if (opType.opType === OperationTypeSort.second) {
        opTypes.push({
          op_key: `${this.rootOpType}.${opType.pOpKey}.${opType.opKey}`,
          op_value: opType.opName,
          p_op_key: `${this.rootOpType}.${opType.pOpKey}`
        })
      }
    }
    return opTypes
  }
}

export default new Audit()
