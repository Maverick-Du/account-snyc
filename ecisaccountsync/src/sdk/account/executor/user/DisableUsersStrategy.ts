import {log, Ticker} from '../../../cognac/common';
import {SyncStrategyType} from '../../sync'
import {
    IDisableUsersContext,
    IDisableUsersResult,
    IDisableUsersStrategy
} from "../../sync/engine/strategies/DisableUsersStrategy";

export class DisableUsersStrategy implements IDisableUsersStrategy {
    name: string = SyncStrategyType.DisableUsers

    async exec(ctx: IDisableUsersContext): Promise<IDisableUsersResult> {
        const { engine, task, users } = ctx
        const tick = new Ticker()
        await engine.was.enableUsers(task.cfg.companyId, users, false)
        log.debug({ info: `full sync ${task.taskId} disableUsers: ${users.map(item => `${item.login_name}&${item.user_id}`).join(',')} success[${tick.end()}]` })
        return { code: 'ok' }
    }
}
