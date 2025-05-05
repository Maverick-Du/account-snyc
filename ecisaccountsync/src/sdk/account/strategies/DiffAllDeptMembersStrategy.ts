import {
    IDiffAllDeptMembersContext, IDiffAllDeptMembersResult,
    IDiffAllDeptMembersStrategy
} from "../sync/engine/strategies/DiffAllDeptMembersStrategy";
import {
    DeptLeader,
    LocalDeptAndWpsDept,
    SyncStrategyType,
} from "../sync";
import config from "../../../common/config";
import {IUpdateDepartmentLeadersContext} from "../sync/engine/strategies/UpdateDepartmentLeadersStrategy";
import {WpsOpenDepartment} from "../../v7/org/open/v1";

export class DiffAllDeptMembersStrategy implements IDiffAllDeptMembersStrategy {
    name: string = SyncStrategyType.DiffAllDepartmentMembers

    async exec(ctx: IDiffAllDeptMembersContext): Promise<IDiffAllDeptMembersResult> {
        for (const platId of ctx.task.cfg.platformIdList) {
            // 查询所有本地部门
            let minDeptId = await ctx.engine.las.getDeptMinOrMaxId(ctx.task.originTaskId, ctx.task.cfg.thirdCompanyId, platId, 'ASC')
            let maxDeptId = await ctx.engine.las.getDeptMinOrMaxId(ctx.task.originTaskId, ctx.task.cfg.thirdCompanyId, platId, 'DESC')
            let localDepts = await ctx.engine.las.pageQueryDepts(ctx.task.originTaskId, ctx.task.cfg.thirdCompanyId, platId, minDeptId, maxDeptId)

            // 查询所有本地部门的leaders
            let minDeptUserId = await ctx.engine.las.getDeptUerMinOrMaxId(ctx.task.originTaskId, ctx.task.cfg.thirdCompanyId, platId, 'ASC')
            let maxDeptUserId = await ctx.engine.las.getDeptUerMinOrMaxId(ctx.task.originTaskId, ctx.task.cfg.thirdCompanyId, platId, 'DESC')
            let localDeptUsers = await ctx.engine.las.pageQueryDeptUsers(ctx.task.originTaskId, ctx.task.cfg.thirdCompanyId, platId, minDeptUserId, maxDeptUserId)
            let leaderDeptUsers = localDeptUsers.filter(du => du.leader > 0)
            let uidUserMap = new Map<string, string>()
            await this.groupOpt(leaderDeptUsers, async (items)=>{
                let uids = items.map(item => item.uid)
                let wpsUsers = await ctx.engine.was.queryUsersByThirdUnionIds(ctx.task.cfg.companyId, platId, uids)
                for (const wpsUser of wpsUsers) {
                    uidUserMap.set(wpsUser.third_union_id, wpsUser.user_id)
                }
            }, 100)

            let leaderMap = new Map<string, DeptLeader[]>()
            for (const leaderDeptUser of leaderDeptUsers) {
                // 可能会为空
                let user_id = uidUserMap.get(leaderDeptUser.uid)
                let leaders = leaderMap.get(leaderDeptUser.did)
                if (!leaders) {
                    leaderMap.set(leaderDeptUser.did, [{uid: leaderDeptUser.uid, order: leaderDeptUser.order, user_id: user_id} as DeptLeader])
                }
                leaders.push({uid: leaderDeptUser.uid, order: leaderDeptUser.order, user_id: user_id} as DeptLeader)
                leaderMap.set(leaderDeptUser.did, leaders)
            }
            if (leaderMap.size > 0) {
                for (const localDept of localDepts) {
                    localDept.leaders = leaderMap.get(localDept.did)
                }
            }

            // 查询所有云文档部门
            let allWpsDeptsMap = new Map<string, WpsOpenDepartment>()
            await this.groupOpt(localDepts, async (items)=>{
                let dids = items.map(item => item.did)
                let wpsDepartments = await ctx.engine.openIam.getDeptsByExDeptIds(ctx.task.cfg.companyId, dids)
                for (const wpsDepartment of wpsDepartments) {
                    allWpsDeptsMap.set(wpsDepartment.ex_dept_id, wpsDepartment)
                }
            }, 100)

            // 异步对比部门leader并更新
            await this.groupOpt(localDepts, async (items)=>{
                let deptArr: LocalDeptAndWpsDept[] = []
                for (const item of items) {
                    let wpsDept = allWpsDeptsMap.get(item.did)
                    deptArr.push({localDept: item, wpsDept: wpsDept} as LocalDeptAndWpsDept)
                    await ctx.engine.sm.exec(SyncStrategyType.UpdateDepartmentLeaders, {
                        engine: ctx.engine,
                        task: ctx.task,
                        depts: deptArr,
                    } as IUpdateDepartmentLeadersContext)
                }
            }, config.asyncSize)

            // 异步对比部门成员并更新
            await this.groupOpt(localDepts, async (items)=>{
                let deptArr: LocalDeptAndWpsDept[] = []
                for (const item of items) {
                    let wpsDept = allWpsDeptsMap.get(item.did)
                    deptArr.push({localDept: item, wpsDept: wpsDept} as LocalDeptAndWpsDept)
                    await ctx.engine.sm.exec(SyncStrategyType.UpdateDepartmentLeaders, {
                        engine: ctx.engine,
                        task: ctx.task,
                        depts: deptArr,
                    } as IUpdateDepartmentLeadersContext)
                }
            }, config.asyncSize)
        }
        return {code: "ok"}
    }

    // 分批操作
    async groupOpt<T>(
        data: T[],
        func: { (objectGroup: T[]): Promise<void> },
        groupSize: number = 100
    ) {
        const groupList = this.averageList(data, groupSize)
        for (const objectGroup of groupList) {
            await func(objectGroup)
        }
    }

    averageList<T>(list: T[], groupSize: number = 100): T[][] {
        const groupList: T[][] = []
        let start = 0
        let end = 0

        while (start < list.length) {
            end = start + groupSize
            if (end > list.length) {
                end = list.length
            }

            const objectGroup = list.slice(start, end)
            groupList.push(objectGroup)
            start = end
        }
        return groupList
    }
}
