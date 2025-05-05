import {GetWpsOpenAccessTokenResult, WpsOpenAccessToken} from "./types";
import {KSO1Context, KSO1Params, KSO1Request} from "../../../../common/kso1";
import config from "../../../../../common/config";

export class AccessTokenService {
    ctx: KSO1Context
    appTokenCache: Map<string, WpsOpenAccessToken>

    constructor(ctx: KSO1Context) {
        this.ctx = ctx
        this.appTokenCache = new Map<string, WpsOpenAccessToken>()
    }

    private query(params: KSO1Params = {}) {
        return {
            ...params
        }
    }

    async getAppToken(companyId: string) {
        let now = new Date().getTime()
        let token = this.appTokenCache.get(companyId)
        if (token && now < token.expires_time) {
            return token
        }
        let tokenRes = await this.requestAppToken(companyId)
        if (tokenRes && tokenRes.code == 0) {
            // 转成毫秒，提前10秒过期
            tokenRes.data.expires_time = now + tokenRes.data.expires_in * 1000 - (10 * 1000)
            this.appTokenCache.set(companyId, tokenRes.data)
        } else {
            throw new Error(`getAppToken throw Error, companyId: ${companyId}, res: ${tokenRes}`)
        }
    }

    async requestAppToken(companyId: string) {
        const req = new KSO1Request(this.ctx)
        return req.post<GetWpsOpenAccessTokenResult>(
            `/oauth2/token`,
            this.query({
                grant_type: "client_credentials",
                client_id: config.appId,
                client_secret: config.appKey,
                company_id: companyId
            }),
            {},
            "application/x-www-form-urlencoded"
        )
    }
}
