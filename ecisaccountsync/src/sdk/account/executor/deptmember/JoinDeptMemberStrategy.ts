import {LocalMemberMainEnum, SyncStrategyType} from "../../sync";
import {log, Ticker} from '../../../cognac/common';
import {
    IJoinDeptMemberContext,
    IJoinDeptMemberResult,
    IJoinDeptMemberStrategy
} from "../../sync/engine/strategies/JoinDeptMemberStrategy";

export class JoinDeptMemberStrategy implements IJoinDeptMemberStrategy {
    name: string = SyncStrategyType.JoinDepartmentMember

    async exec(ctx: IJoinDeptMemberContext): Promise<IJoinDeptMemberResult> {
        const { engine, task, dept, wu, user } = ctx

        const isMainDept = user.main === LocalMemberMainEnum.TRUE
        // 2. 绑定 && 主部门设置
        await engine.was.addUserToDepartment(
            dept.company_id,
            dept,
            wu.user_id,
            user.order,
            isMainDept,
        )
        log.debug({ info: `full sync ${task.taskId} addUserToDepartment deptName: ${dept.name} deptId: ${dept.dept_id} userId: ${wu.user_id}` })
        return {code: "ok"}
    }
}
