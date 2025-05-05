import KSO1, {KSO1Context, KSO1Params, KSO1Request} from "../../../../common/kso1";
import {WPS4Request} from "../../../../common/wps4";
import {GetBatchCompanyDeptsResult, GetCompanyDeptResult, UpdateCompanyDeptResult} from "../../dev/v1";
import {GetWpsOpenDeptResult, GetWpsOpenDeptsResult, WpsOpenDepartment, WpsOpenDeptLeader} from "./types";
import {AccessTokenService} from "./AccessTokenService";


export class IamService {
    ctx: KSO1Context
    tokenService: AccessTokenService

    constructor(ctx: KSO1Context, tokenService: AccessTokenService) {
        this.ctx = ctx
        this.tokenService = tokenService
    }

    private query(params: KSO1Params = {}) {
        return {
            ...params
        }
    }

    async root(companyId: string) {
        let appToken = await this.tokenService.getAppToken(companyId)
        const req = new KSO1Request(this.ctx)
        req.headers["Authorization"] = `Bearer ${appToken.access_token}`
        return req.get<GetWpsOpenDeptResult>(
            `/v7/depts/root`,
            this.query()
        )
    }

    async getDeptsByExDeptIds(companyId: string, ex_dept_ids: string[]) {
        let appToken = await this.tokenService.getAppToken(companyId)
        const req = new KSO1Request(this.ctx)
        req.headers["Authorization"] = `Bearer ${appToken.access_token}`
        return req.post<GetWpsOpenDeptsResult>(
            `/v7/depts/by_ex_dept_ids`,
            this.query(),
            {
                ex_dept_ids
            }
        )
    }

    async updateDept(companyId: string, dept: WpsOpenDepartment) {
        let appToken = await this.tokenService.getAppToken(companyId)
        const req = new KSO1Request(this.ctx)
        req.headers["Authorization"] = `Bearer ${appToken.access_token}`
        return req.post<UpdateCompanyDeptResult>(
            `/v7/depts/${dept.id}/update`,
            this.query(),
            dept
        )
    }
}
