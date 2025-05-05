import {log, Ticker} from '../../../cognac/common';
import { SyncStrategyType } from '../../sync'
import {
  IUpdateDepartmentLeadersContext, IUpdateDepartmentLeadersResult,
  IUpdateDepartmentLeadersStrategy
} from "../../sync/engine/strategies/UpdateDepartmentLeadersStrategy";
import {CountDownLatch} from "../../../../common/CountDownLatch";
import {WpsOpenDepartment, WpsOpenDeptLeader} from "../../../v7/org/open/v1";

export class UpdateDepartmentLeadersStrategy implements IUpdateDepartmentLeadersStrategy {
    name: string = SyncStrategyType.UpdateDepartmentLeaders

    async exec(ctx: IUpdateDepartmentLeadersContext): Promise<IUpdateDepartmentLeadersResult> {
        const { engine, depts, task } = ctx
        log.debug({ info: `full sync ${task.taskId} updateDeptLeaders start` })
        let latch = new CountDownLatch(depts.length)
        for (const d of depts) {
            if (!d.wpsDept) {
                latch.countDown()
            }
            let localDeptLeaders: string[] = []
            let wpsDeptLeaders: string[] = []
            d.localDept.leaders?.forEach(x => localDeptLeaders.push(x.user_id))
            d.wpsDept.leaders?.forEach(x => wpsDeptLeaders.push(x.user_id))

            if (this.arraysEqualUnOrdered(localDeptLeaders, wpsDeptLeaders)) {
                latch.countDown()
            } else {
                // 更新部门领导
                let leaders: WpsOpenDeptLeader[] = []
                for (const leader of d.localDept.leaders) {
                    leaders.push({
                        user_id: leader.user_id,
                        order: leader.order
                    } as WpsOpenDeptLeader)
                }
                engine.openIam.updateDept(task.cfg.companyId, {
                    id: d.wpsDept.id,
                    leaders: leaders
                } as WpsOpenDepartment).then(() => {
                    latch.countDown()
                    log.i({ info: `full sync ${task.taskId} updateDeptLeader success deptName: ${d.wpsDept.name} deptId: ${d.wpsDept.id} did: ${d.wpsDept.ex_dept_id}` })
                    // TODO 记录统计数据
                }).catch(err => {
                    latch.countDown()
                    err.msg = `full sync ${task.taskId} updateDeptLeader throw error, deptName: ${d.wpsDept.name} deptId: ${d.wpsDept.id} did: ${d.wpsDept.ex_dept_id}.`
                    log.e(err)
                    // TODO 记录统计数据
                })
            }
        }
        await latch.await()
        return {code: "ok"}
    }

    arraysEqualUnOrdered(arr1: string[], arr2: string[]): boolean {
        if (arr1.length !== arr2.length) {
          return false;
        }
        const sortedArr1 = arr1.slice().sort();
        const sortedArr2 = arr2.slice().sort();
        return sortedArr1.every((value, index) => value === sortedArr2[index]);
    }
}
