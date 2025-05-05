import { useContext, useEffect, useState } from "react";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
import statisticsPng from "@/assets/statistics.png";
import questionPng from "@/assets/question.png";
import style from "./style.module.less";
import { getSyncEndTime } from "@/api/common";
import { Card, Tooltip } from "antd";
import { autoSyncStatus, SYNC_FULL, SYNC_INCREMENT, TSettingTimeType } from "@/constants";
import { SettingContext } from "@/page";

// interface IProps {
//   openSyncSetting: () => void;
//   changeSyncType: (type: TSettingTimeType) => void;
// }

export default function SyncInfo() {
  const { setShowFullSetting, setShowIncrementSetting } = useContext(SettingContext);
  // const { openSyncSetting, changeSyncType } = props;

  const [fullSyncTime, setFullSyncTime] = useState<number>();
  const [incrementSyncTime, setIncrementSyncTime] = useState<number>();
  const [fullSyncOpen, setFullSyncOpen] = useState(1);
  const [incrementSyncOpen, setIncrementSyncOpen] = useState(1);

  useEffect(() => {
    const timer = (window as any)._accountTimer_;
    timer && clearInterval(timer);

    (window as any)._accountTimer_ = setInterval(getEndTime(), 1000 * 300);
  }, []);

  const getEndTime = () => {
    getSyncEndTime().then((res) => {
      setFullSyncTime(res?.data?.full_sync_end);
      setFullSyncOpen(res?.data?.full_sync_open);
      setIncrementSyncTime(res?.data?.increment_sync_end);
      setIncrementSyncOpen(res?.data?.increment_sync_open);
    });
    return getEndTime;
  };

  const openFullSetting = () => setShowFullSetting(true);

  const openIncrementSetting = () => setShowIncrementSetting(true);

  // const handleOpenSyncSetting = (type: TSettingTimeType) => {
  //   openSyncSetting();
  //   changeSyncType(type);
  // };

  return (
    <div className={style["sync-record"]}>
      <img src={statisticsPng} width={22} alt="" />
      <div className={style["info"]}>
        <Card style={{ width: 300 }}>
          <div className={style["title"]}>
            <span>{ZH_CN["full_sync"]}</span>
            <a className={style["setting"]} onClick={openFullSetting}>
              {ZH_CN["sync_setting"]}
            </a>
          </div>
          <div className={style["time"]}>
            {ZH_CN["sync_recent_end_time"]}：{fullSyncTime ? new Date(fullSyncTime).toLocaleString() : "-"}
          </div>
          <div className={style["status"]}>
            <div className={style["desc"]}>
              {ZH_CN["sync_auto_status"]}
              <Tooltip title={ZH_CN["sync_auto_status_full_tips"]} placement="bottom">
                <img src={questionPng} width={14} className={style["desc-icon"]} />
              </Tooltip>
              ：
              <div style={{ color: !!fullSyncOpen ? "#0256FF" : "#EA0000" }}>
                {autoSyncStatus[fullSyncOpen as 0 | 1]}
              </div>
            </div>
          </div>
        </Card>
        <Card style={{ width: 300, marginLeft: 20 }}>
          <div className={style["title"]}>
            <span>{ZH_CN["increment_sync"]}</span>
            <a className={style["setting"]} onClick={openIncrementSetting}>
              {ZH_CN["sync_setting"]}
            </a>
          </div>
          <div className={style["time"]}>
            {ZH_CN["sync_recent_end_time"]}：{incrementSyncTime ? new Date(incrementSyncTime).toLocaleString() : "-"}
          </div>
          <div className={style["status"]}>
            <div className={style["desc"]}>
              {ZH_CN["sync_auto_status"]}
              <Tooltip title={ZH_CN["sync_auto_status_increment_tips"]} placement="bottom">
                <img src={questionPng} width={14} className={style["desc-icon"]} />
              </Tooltip>
              ：
              <div style={{ color: !!incrementSyncOpen ? "#0256FF" : "#EA0000" }}>
                {autoSyncStatus[incrementSyncOpen as 0 | 1]}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
