import AutoSyncSetting from "./autoSyncSetting";
import SettingTitle from "../settingTitle";
import { SettingContext } from "@/page";
import { useContext } from "react";
import Manage from "./manage";
import {
  SYNC_FULL_SETTING_AUTO,
  SYNC_FULL_SETTING_DEFAULT,
  SYNC_FULL_SETTING_RANGE,
  SYNC_FULL_SETTING_ROLLBACK,
  SYNC_FULL_SETTING_THRESHOLD,
} from "@/constants";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
import style from "./style.module.less";
import ThresholdSetting from "./thresholdSetting";
import RollbackSetting from "./rollbackSetting";
import RangeSetting from "./rangeSetting";

export default function FullSetting() {
  const { fullSettingType, setFullSettingType, setShowFullSetting } = useContext(SettingContext);

  const closeSetting = () => {
    switch (fullSettingType) {
      case SYNC_FULL_SETTING_DEFAULT:
        setShowFullSetting(false);
        break;
      default:
        setFullSettingType(SYNC_FULL_SETTING_DEFAULT);
        break;
    }
  };

  const showSetting = {
    [SYNC_FULL_SETTING_DEFAULT]: <Manage />,
    [SYNC_FULL_SETTING_AUTO]: <AutoSyncSetting />,
    [SYNC_FULL_SETTING_THRESHOLD]: <ThresholdSetting />,
    [SYNC_FULL_SETTING_RANGE]: <RangeSetting />,
    [SYNC_FULL_SETTING_ROLLBACK]: <RollbackSetting />,
  };

  return (
    <>
      <SettingTitle closeSetting={closeSetting} title={ZH_CN[`full_sync_setting_${fullSettingType}`]} />
      <div className={style["container"]}> {showSetting[fullSettingType]}</div>
    </>
  );
}
