import {SyncStrategyType, WPSUserStatus} from "../../sync";
import {
    IDeleteDepartmentMemberContext, IDeleteDepartmentMemberResult,
    IDeleteDepartmentMemberStrategy
} from "../../sync/engine/strategies/DeleteDepartmentMemberStrategy";
import {log, Ticker} from '../../../cognac/common';

export class DeleteDeptMemberStrategy implements IDeleteDepartmentMemberStrategy {
    name: string = SyncStrategyType.DeleteDepartmentMember

    async exec(ctx: IDeleteDepartmentMemberContext): Promise<IDeleteDepartmentMemberResult> {
        const { engine, task, root, dept, user, diffRootMember } = ctx

        // 1. 忽略 third_union_id==null 用户
        if (!user.third_union_id || user.third_union_id.length === 0) {
            return { code: 'fail', message: '自建用户无法移出' }
        }
        if (user.status === WPSUserStatus.Disabled) {
            return {code: 'fail', message: '禁用用户无法移出'}
        }
        // 2. 解除绑定，保证不能成为游离用户
        // 2.1 先获取用户所在部门列表
        const depts = await engine.was.listDepartmentsByUser(dept.company_id, user)
        // 2.2 仅存在一个部门的话，先加入根部门
        if (depts.length === 1) {
            if (depts[0].dept_id === root.dept_id) {
                if (diffRootMember) {
                    return {code: 'need_disable', message: '禁用游离用户'}
                } else {
                    return {code: 'fail', message: '最后一个部门且为根部门暂不移出'}
                }
            }
            await engine.was.addUserToDepartment(
                dept.company_id,
                root,
                user.user_id,
                0,
                false,
            )
            log.i({ info: `full sync ${task.taskId} deleteDeptMember tempJoinRootDept deptName: ${dept.name} deptId: ${dept.dept_id} userId: ${user.user_id}` })
        }
        // 2.3 移除当前部门
        await engine.was.removeUserFromDepartment(
            dept.company_id,
            dept,
            user.user_id,
        )
        log.debug({ info: `full sync ${task.taskId} deleteDeptMember removeUser deptName: ${dept.name} deptId: ${dept.dept_id} userId: ${user.user_id}` })
        return {code: 'ok', message: '移出成功'}
    }

}
