/* eslint-disable camelcase */
import {
  GetTenantDetailResult,
  GetTenantDetailsResult,
  InitTenantAdminResult
} from './types'
import {WPS4Context, WPS4Request} from "../../../common/wps4";

export class TenantsService {
  ctx: WPS4Context

  constructor(ctx: WPS4Context) {
    this.ctx = ctx
  }

  async getTenantList(offset: number = 0, limit: number = 1000) {
    const req = new WPS4Request(this.ctx)
    return req.get<GetTenantDetailsResult>('/v7/dev/tenants/details', {
      offset,
      limit,
    })
  }

  async getTenantByCode(code: string) {
    const req = new WPS4Request(this.ctx)
    return req.get<GetTenantDetailResult>('/v7/dev/tenants/by_code', {
      code,
    })
  }

  async createTenant(code: string, name: string) {
    const req = new WPS4Request(this.ctx)
    return req.post<GetTenantDetailResult>(
      '/v7/dev/tenants/create',
      {},
      {
        code,
        name,
      }
    )
  }

  async initTenantAdmin(
    companyId: string,
    admin_account: string,
    admin_password: string
  ) {
    const req = new WPS4Request(this.ctx)
    return req.post<InitTenantAdminResult>(
      `/v7/dev/tenants/${companyId}/initialize_admin`,
      {},
      {
        admin_account,
        admin_password,
      }
    )
  }
}
