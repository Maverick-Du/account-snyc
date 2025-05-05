import SettingTitle from "../settingTitle";
import AutoSyncSetting from "./autoSyncSetting";
import FrequencySetting from "./frequencySetting";
import { SettingContext } from "@/page";
import { useContext } from "react";
import Manage from "./manage";
import {
  SYNC_INCREMENT_SETTING_AUTO,
  SYNC_INCREMENT_SETTING_DEFAULT,
  SYNC_INCREMENT_SETTING_FREQUENCY,
} from "@/constants";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
import style from "./style.module.less";

export default function IncrementSetting() {
  const { incrementSettingType, setIncrementSettingType, setShowIncrementSetting } = useContext(SettingContext);

  const closeSetting = () => {
    switch (incrementSettingType) {
      case SYNC_INCREMENT_SETTING_DEFAULT:
        setShowIncrementSetting(false);
        break;
      default:
        setIncrementSettingType(SYNC_INCREMENT_SETTING_DEFAULT);
        break;
    }
  };

  const showSetting = {
    [SYNC_INCREMENT_SETTING_DEFAULT]: <Manage />,
    [SYNC_INCREMENT_SETTING_AUTO]: <AutoSyncSetting />,
    [SYNC_INCREMENT_SETTING_FREQUENCY]: <FrequencySetting />,
  };

  return (
    <>
      <SettingTitle closeSetting={closeSetting} title={ZH_CN[`increment_sync_setting_${incrementSettingType}`]} />
      <div className={style["container"]}>{showSetting[incrementSettingType]}</div>
    </>
  );
}
