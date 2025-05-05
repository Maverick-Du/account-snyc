import {LocalMemberMainEnum, SyncStrategyType} from "../../sync";
import {log, Ticker} from '../../../cognac/common';
import {
    IUpdateDeptMemberContext, IUpdateDeptMemberResult,
    IUpdateDeptMemberStrategy
} from "../../sync/engine/strategies/UpdateDepartmentMemberStrategy";

export class UpdateDeptMemberStrategy implements IUpdateDeptMemberStrategy {
    name: string = SyncStrategyType.UpdateDepartmentMember

    async exec(ctx: IUpdateDeptMemberContext): Promise<IUpdateDeptMemberResult> {
        const { engine, task, dept, user, from } = ctx

        if (from.order && user.order !== from.order) {
            await engine.was.updateDepartmentMembersOrder(user.company_id, [
                {
                    user_id: user.user_id,
                    dept_id: dept.dept_id,
                    order: from.order,
                },
            ])
            log.i({ info: `full sync ${task.taskId} updateDeptMember updateSort deptName: ${dept.name} deptId: ${dept.dept_id} userId: ${user.user_id}, order: ${from.order}` })
        }
        // 更新主部门
        if (
            from.main === LocalMemberMainEnum.TRUE &&
            user.def_dept_id !== dept.dept_id
        ) {
            await engine.was.addUserToDepartment(
                dept.company_id,
                dept,
                user.user_id,
                from.order,
                true,
            )
            log.i({ info: `full sync ${task.taskId} updateDeptMember updateDeptMain deptName: ${dept.name} deptId: ${dept.dept_id} userId: ${user.user_id}` })
        }
        return {code: "ok"}
    }

}
