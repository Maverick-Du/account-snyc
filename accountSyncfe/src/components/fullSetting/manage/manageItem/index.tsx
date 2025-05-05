import { SettingContext } from "@/page";
import { useContext, useEffect, useState } from "react";
import style from "./style.module.less";
import {
  autoSyncStatus,
  fullSyncSettingType,
  SYNC_FULL_SETTING_AUTO,
  SYNC_FULL_SETTING_RANGE,
  SYNC_FULL_SETTING_ROLLBACK,
  SYNC_FULL_SETTING_THRESHOLD,
  TFullSyncSettingType,
} from "@/constants";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
import { camel, getEnumKeyByValue } from "@/utils";
import { fullSyncApi } from "@/api/fullSync";
import { rollbackApi } from "@/api/rollback";

interface IProps {
  type: TFullSyncSettingType;
}

interface IRanges {
  error: boolean;
  num: number;
  taskId: string;
  isDefault: boolean;
}

export default function ManageItem(props: IProps) {
  const { type } = props;
  const { setFullSettingType } = useContext(SettingContext);
  const [open, setOpen] = useState(0);
  const [threshold, setThreshold] = useState({ deptDel: 20, userDel: 200, deptUserDel: 1 });
  const [rollbackTaskId, setRollbackTaskId] = useState("");
  const [range, setRange] = useState<IRanges>();

  const getThreshold = async () => {
    const res = await fullSyncApi.getFullSyncThreshold();
    if (res) setThreshold(camel(res?.data));
  };

  const getSchedule = async () => {
    const res = await fullSyncApi.getFullSyncSchedule();
    if (res) setOpen(res?.data?.open);
  };

  const getRollback = async () => {
    const res = await rollbackApi.checkRollbackTask();
    if (res) setRollbackTaskId(res?.data?.taskId);
  };

  const getRange = async () => {
    const res = await fullSyncApi.getFullSyncRangeList({});
    if (res) {
      const { task_id: taskId, scope, deleteScopes } = res?.data;
      const error = deleteScopes.length !== 0;
      const isDefault = scope?.check_type === 1;
      let num = scope?.check_type;

      const getNum = (data: any) => {
        data?.subs?.map((item: any) => {
          const { check_type } = item;
          num += check_type || 0;
          if (!check_type) getNum(item);
        });
      };
      if (!num) getNum(scope);

      setRange({ error, num, taskId, isDefault });
    }
  };

  useEffect(() => {
    getTypeDetail();
  }, []);

  const getTypeDetail = async () => {
    switch (type) {
      case SYNC_FULL_SETTING_AUTO:
        await getSchedule();
        break;
      case SYNC_FULL_SETTING_THRESHOLD:
        await getThreshold();
        break;
      case SYNC_FULL_SETTING_RANGE:
        await getRange();
        break;
      case SYNC_FULL_SETTING_ROLLBACK:
        await getRollback();
        break;
      default:
        return;
    }
  };

  const openSetting = () => setFullSettingType(type);

  return (
    <div className={style["full-setting-manage-item"]}>
      <div className={style["title"]}>{getEnumKeyByValue(fullSyncSettingType, type)}</div>
      <div className={style["detail-text"]}>
        {type === SYNC_FULL_SETTING_AUTO && (
          <>
            {ZH_CN["sync_auto_status"]}：
            <span style={{ color: !!open ? "#0256FF" : "#EA0000" }}>{autoSyncStatus[open as 0 | 1]}</span>
          </>
        )}
        {type === SYNC_FULL_SETTING_THRESHOLD && (
          <>
            <div>
              {ZH_CN["full_sync_setting_manage_threshold_user"]}：{threshold?.userDel}
            </div>
            <div>
              {ZH_CN["full_sync_setting_manage_threshold_dept"]}：{threshold?.deptDel}
            </div>
            <div>
              {ZH_CN["full_sync_setting_manage_threshold_dept_user"]}：{threshold?.deptUserDel}
            </div>
          </>
        )}
        {type === SYNC_FULL_SETTING_RANGE && (
          <>
            {range?.taskId ? (
              <>
                {range?.error ? (
                  <div style={{ color: "#EA0000" }}>{ZH_CN["full_sync_setting_manage_range_error"]}</div>
                ) : (
                  <>
                    {ZH_CN["full_sync_setting_manage_range_title_front"]} {range?.taskId || ""}{" "}
                    {ZH_CN["full_sync_setting_manage_range_title_back"]}
                  </>
                )}
                <div>
                  {ZH_CN["full_sync_setting_manage_range_checked"]}：{/* 异常、默认情况 */}
                  {range?.error
                    ? ZH_CN["full_sync_setting_manage_range_checked_error_default_front"] +
                      (range?.num || 0) +
                      ZH_CN["full_sync_setting_manage_range_checked_error_default_back"]
                    : range?.isDefault
                    ? ZH_CN["full_sync_setting_manage_range_checked_default"]
                    : ZH_CN["full_sync_setting_manage_range_checked_select_front"] +
                      (range?.num || 0) +
                      ZH_CN["full_sync_setting_manage_range_checked_select_back"]}
                </div>
              </>
            ) : (
              <div>{ZH_CN["full_sync_setting_manage_range_nodata"]}</div>
            )}
          </>
        )}
        {type === SYNC_FULL_SETTING_ROLLBACK && (
          <>
            {rollbackTaskId ? (
              <div>
                {ZH_CN["full_sync_setting_manage_rollback"]}
                <br />
                {ZH_CN["full_sync_setting_manage_rollback_id"]}：{rollbackTaskId}
              </div>
            ) : (
              <div>{ZH_CN["full_sync_setting_manage_rollback_nodata"]}</div>
            )}
          </>
        )}
      </div>
      <div className={style["action"]} onClick={openSetting}>
        {ZH_CN["sync_setting"]}
      </div>
    </div>
  );
}
