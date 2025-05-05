import ZH_CN from "@/assets/i18n/locales/zh-CN";
import { FULL_SYNC_CANCEL, FULL_SYNC_WAIT } from "@/constants";
import { IFullSyncDetail } from "@/types/fullSync";

function getDefaultValue<T>(o: T, key = "--") {
  const obj: T = {} as T;
  for (const prop in o) {
    let value = o[prop as keyof T];
    if (value === null || value === undefined || value === "") {
      // @ts-ignore
      obj[prop] = key;
    } else obj[prop as keyof T] = value;
  }
  return obj;
}

export function getFullDeptSync(data: IFullSyncDetail) {
  if (!data) return "";
  const { deptAdd, deptUpdate, deptDelete, deptMove, totalDept, syncDept, status, scopeDept } = getDefaultValue(data);

  if (status === FULL_SYNC_CANCEL || status === FULL_SYNC_WAIT) return ZH_CN["no_data"];

  return `${ZH_CN["full_sync_total_dept"]}：${totalDept}；${ZH_CN["full_sync_checked_dept"]}：${scopeDept}；
${ZH_CN["full_sync_sync_dept"]}：${syncDept}；${ZH_CN["full_sync_dept_action"]}：${ZH_CN["full_sync_add_dept"]}：${deptAdd}； ${ZH_CN["full_sync_update_dept"]}：${deptUpdate}； ${ZH_CN["full_sync_delete_dept"]}：${deptDelete}；${ZH_CN["full_sync_move_dept"]}：${deptMove}`;
}

export function getFullUserSync(data: IFullSyncDetail) {
  if (!data) return "";
  const { userAdd, userUpdate, userDelete, totalUser, syncUser, status, scopeUser } = getDefaultValue(data);

  if (status === FULL_SYNC_CANCEL || status === FULL_SYNC_WAIT) return ZH_CN["no_data"];

  return `${ZH_CN["full_sync_total_user"]}：${totalUser}；${ZH_CN["full_sync_checked_user"]}：${scopeUser}；
${ZH_CN["full_sync_sync_user"]}：${syncUser}；${ZH_CN["full_sync_user_action"]}：${ZH_CN["full_sync_add_user"]}：${userAdd}； ${ZH_CN["full_sync_update_user"]}：${userUpdate}； ${ZH_CN["full_sync_delete_user"]}：${userDelete}`;
}

export function getFullUserDeptSync(data: IFullSyncDetail) {
  if (!data) return "";
  const { deptUserAdd, deptUserDelete, userDeptUpdate, status, totalDeptUser, scopeDeptUser } =
    getDefaultValue(data);

  if (status === FULL_SYNC_CANCEL || status === FULL_SYNC_WAIT) return ZH_CN["no_data"];

  return `${ZH_CN["full_sync_total_user"]}：${totalDeptUser}；${ZH_CN["full_sync_checked_user"]}：${scopeDeptUser}；
${ZH_CN["full_sync_dept_user_add"]}：${deptUserAdd}；${ZH_CN["full_sync_dept_user_delete"]}：${deptUserDelete}；${ZH_CN["full_sync_dept_user_sort_update"]}：${userDeptUpdate}；`;
}
