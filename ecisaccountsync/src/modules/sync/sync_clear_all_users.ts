import { SyncContext } from './context'

export default async function syncClearAllUsers(
  ctx: SyncContext,
  taskId: string,
  lCompanyId: string,
  wCompanyId: string,
  platformId: string,
) {
  const { was, las } = ctx
  const lusers = await las.getAllUsersListNoCustom(taskId, lCompanyId, platformId)
  for (const user of lusers) {
    const wpsUser = await was.getUserByLocal(
      wCompanyId,
      user.platform_id,
      user.uid,
    )
    if (wpsUser) {
      await was.deleteUser(wCompanyId, wpsUser)
    }
  }
}
