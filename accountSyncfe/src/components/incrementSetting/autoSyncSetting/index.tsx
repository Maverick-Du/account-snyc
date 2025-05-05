import { useEffect, useState } from "react";
import ZH_CN from "../../../assets/i18n/locales/zh-CN";
import style from "../style.module.less";
import questionPng from "../../../assets/question.png";
import { autoSyncStatus } from "@/constants";
import { message, Switch } from "antd";
import Tooltip from "antd/es/tooltip";
import { incrementSyncApi } from "@/api/incrementSync";

export default function AutoSyncSetting() {
  const [open, setOpen] = useState(0);

  useEffect(() => {
    getAutoSyncStatus();
  }, []);

  const changeIncrementOpen = async (checked: boolean) => {
    const res = await incrementSyncApi.setIncrementSyncSchedule({ open: Number(checked) });

    if (res && checked) message.info(ZH_CN["sync_auto_setting_open_success"]);
    else if (res && !checked) message.info(ZH_CN["sync_auto_setting_stop_success"]);
    setOpen(Number(checked));
  };

  const getAutoSyncStatus = async () => {
    const res = await incrementSyncApi.getIncrementSyncSchedule();
    if (res) setOpen(res?.data?.open);
  };

  return (
    <>
      <div className={style["setting-title"]}>{ZH_CN["sync_auto_setting"]}</div>
      <div className={style["setting-item"]}>
        <div className={style["title"]}>
          {ZH_CN["sync_auto_status"]}
          <Tooltip title={ZH_CN["sync_auto_status_increment_tips"]} placement="bottom">
            <img src={questionPng} width={14} className={style["tip-icon"]} />
          </Tooltip>
          ：
        </div>
        <div style={{ color: !!open ? "#0256FF" : "#EA0000" }}>{autoSyncStatus[open as 0 | 1]}</div>
        <div style={{ width: 10 }}></div>
        <Switch checked={!!open} onChange={changeIncrementOpen} />
      </div>
      <div className={style["setting-tip"]}>{ZH_CN["sync_auto_status_setting_increment_tips"]}</div>
    </>
  );
}
