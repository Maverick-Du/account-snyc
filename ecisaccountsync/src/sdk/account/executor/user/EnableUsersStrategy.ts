import {log, Ticker} from '../../../cognac/common';
import {SyncStrategyType} from '../../sync'
import {
    IEnableUsersContext,
    IEnableUsersResult,
    IEnableUsersStrategy
} from "../../sync/engine/strategies/EnableUsersStrategy";


export class EnableUsersStrategy implements IEnableUsersStrategy {
    name: string = SyncStrategyType.EnableUsers

    async exec(ctx: IEnableUsersContext): Promise<IEnableUsersResult> {
        const { engine, task, users } = ctx
        const tick = new Ticker()
        await engine.was.enableUsers(task.cfg.companyId, users, true)
        log.debug({ info: `full sync ${task.taskId} enableUsers: ${users.map(item => `${item.login_name}&${item.user_id}`).join(',')} success[${tick.end()}]` })
        return { code: 'ok' }
    }
}
