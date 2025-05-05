import {AccessTokenService, IamService, WpsOpenDepartment} from "../../../v7/org/open/v1";
import KSO1, {KSO1Context} from "../../../common/kso1";

export class V7OpenIamService {
    private openIamService: IamService

    constructor(kso1Ctx: KSO1Context) {
        let tokenService = new AccessTokenService(kso1Ctx)
        this.openIamService = new IamService(kso1Ctx, tokenService)
    }

    async root(companyId: string) {
        let data = await this.openIamService.root(companyId)
        KSO1.check(data)
        return data.data
    }

    async getDeptsByExDeptIds(companyId: string, ex_dept_ids: string[]) {
        let data = await this.openIamService.getDeptsByExDeptIds(companyId, ex_dept_ids)
        KSO1.check(data)
        return data.data.items
    }

    async updateDept(companyId: string, dept: WpsOpenDepartment) {
        let data = await this.openIamService.updateDept(companyId, dept)
        KSO1.check(data)
    }
}
