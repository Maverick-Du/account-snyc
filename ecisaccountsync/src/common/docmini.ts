import {WPS4Context, WPS4Params, WPS4Request} from "../sdk/common/wps4";
import config from "./config";
import {AuditLogType, AuditOpType, AuditScriptsType, CheckCurrentUserRolePermissionResult, GetCurrentUserResult} from "./type";

export default new (class {
  ctx: WPS4Context

  async init() {
    this.ctx = new WPS4Context(
        config.cloud.host,
        config.appId,
        config.appKey,
    )
    if (config.cloud.isMultiTenant == 'true') {
      this.ctx.defaultHeaders['x-cams-caller-company-id'] =
          config.cloud.defaultCompanyId || '1'
    }
  }

  query(params: WPS4Params = {}) {
    return {
      ...params
    }
  }

  async getCurrentUser(wpsSid: string, withDetail = true): Promise<GetCurrentUserResult> {
    const req = new WPS4Request(this.ctx)
    req.headers["Cookie"] = `wps_sid=${wpsSid}`

    return req.get<GetCurrentUserResult>(
        `/v7/sessions/current`,
        this.query({
          "with_detail": withDetail
        })
    )
  }

  async checkCurrentUserRolePermission(userId: string, companyId: number, permissionKeys: string[]) {
    const req = new WPS4Request(this.ctx)
    return req.post<CheckCurrentUserRolePermissionResult>(
        `/v7/dev/access/check_permissions`,
        this.query(),
        {
          user_id: userId,
          company_id: companyId,
          permission_keys: permissionKeys
        })
  }

  async auditOpTypeSet(opTypes: AuditOpType[]) {
    const req = new WPS4Request(this.ctx)
    return req.post(
      `/v7/dev/audit_op_types/batch_set`,
      this.query(),
      {
        op_types: opTypes
      }
    )
  }

  async auditScriptsSet(scripts: AuditScriptsType[]) {
    const req = new WPS4Request(this.ctx)
    return req.post(
      `/v7/dev/audit_scripts/batch_set`,
      this.query(),
      {
        scripts
      }
    )
  }

  async auditLogsWrite(log: AuditLogType) {
    const req = new WPS4Request(this.ctx)
    return req.post(
      `/v7/dev/audit_logs/write`,
      this.query(),
      log
    )
  }
  
})()
