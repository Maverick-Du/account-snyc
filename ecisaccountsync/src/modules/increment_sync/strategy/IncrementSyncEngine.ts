import {StrategyManager} from "./StrategyManager";
import {IncrementStrategyType, IncrementSyncContext} from "./types";
import { v1 } from "../strategy"
import {IncrementUpdateType} from "../../db/types";
import {LasDeptIncrementSchema} from "../../db/tables/LasDepartmentIncrement";
import {LasUserIncrementSchema} from "../../db/tables/LasUserIncrement";
import {LasDeptUserIncrementSchema} from "../../db/tables/LasDepartmentUserIncrement";

export class IncrementSyncEngine {
    sm: StrategyManager = null

    init() {
        this.sm = new StrategyManager()
        this.setup()
    }

    async start(
        ctx: IncrementSyncContext,
        deptData: LasDeptIncrementSchema[],
        userData: LasUserIncrementSchema[],
        deptUserData: LasDeptUserIncrementSchema[]
    ) {
        for (const dd of deptData) {
            switch (dd.update_type) {
                case IncrementUpdateType.DeptDel:
                    ctx.deptIncrement = dd
                    await this.sm.exec(IncrementStrategyType.DeptDelete, ctx)
                    break
                case IncrementUpdateType.DeptUpdate:
                    ctx.deptIncrement = dd
                    await this.sm.exec(IncrementStrategyType.DeptUpdate, ctx)
                    break
                case IncrementUpdateType.DeptAdd:
                    ctx.deptIncrement = dd
                    await this.sm.exec(IncrementStrategyType.DeptAdd, ctx)
                    break
                case IncrementUpdateType.DeptMove:
                    ctx.deptIncrement = dd
                    await this.sm.exec(IncrementStrategyType.DeptMove, ctx)
                    break
                default:
                    throw new Error(`increment sync update_type is error. ${JSON.stringify(dd)}`)
            }
        }
        for (const uu of userData) {
            switch (uu.update_type) {
                case IncrementUpdateType.UserDel:
                    ctx.userIncrement = uu
                    await this.sm.exec(IncrementStrategyType.UserDelete, ctx)
                    break
                case IncrementUpdateType.UserUpdate:
                    ctx.userIncrement = uu
                    await this.sm.exec(IncrementStrategyType.UserUpdate, ctx)
                    break
                case IncrementUpdateType.UserAdd:
                    ctx.userIncrement = uu
                    await this.sm.exec(IncrementStrategyType.UserAdd, ctx)
                    break
                default:
                    throw new Error(`increment sync update_type is error. ${JSON.stringify(uu)}`)
            }
        }
        for (const du of deptUserData) {
            switch (du.update_type) {
                case IncrementUpdateType.UserDeptAdd:
                    ctx.deptUserIncrement = du
                    await this.sm.exec(IncrementStrategyType.UserDeptAdd, ctx)
                    break
                case IncrementUpdateType.UserDeptDel:
                    ctx.deptUserIncrement = du
                    await this.sm.exec(IncrementStrategyType.UserDeptDelete, ctx)
                    break
                case IncrementUpdateType.UserDeptUpdate:
                    ctx.deptUserIncrement = du
                    await this.sm.exec(IncrementStrategyType.UserDeptUpdate, ctx)
                    break
                case IncrementUpdateType.UserDeptMove:
                    ctx.deptUserIncrement = du
                    await this.sm.exec(IncrementStrategyType.UserDeptMove, ctx)
                    break
                default:
                    throw new Error(`increment sync update_type is error. ${JSON.stringify(du)}`)
            }
        }
    }

    private setup() {
        this.sm.load(
            new v1.IncrementDeptAddStrategy(),
            new v1.IncrementDeptDeleteStrategy(),
            new v1.IncrementDeptUpdateStrategy(),
            new v1.IncrementDeptMoveStrategy(),
            new v1.IncrementUserAddStrategy(),
            new v1.IncrementUserUpdateStrategy(),
            new v1.IncrementUserDeleteStrategy(),
            new v1.IncrementUserDeptAddStrategy(),
            new v1.IncrementUserDeptDeleteStrategy(),
            new v1.IncrementUserDeptUpdateStrategy(),
            new v1.IncrementUserDeptMoveStrategy()
            )
    }


}
