import {WPS4Context} from "../sdk/common/wps4";
import config from "./config";

export default new class {
  ctx: WPS4Context

  async init() {
    this.ctx = new WPS4Context(
      config.cams.host, config.appId, config.appKey
    )
    if (config.cloud.isMultiTenant) {
      this.ctx.defaultHeaders['x-cams-caller-company-id'] =
          config.cloud.defaultCompanyId || '1'
    }
  }

}()
