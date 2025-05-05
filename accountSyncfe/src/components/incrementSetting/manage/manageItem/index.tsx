import { SettingContext } from "@/page";
import { useContext, useEffect, useState } from "react";
import style from "./style.module.less";
import {
  autoSyncStatus,
  incrementSyncSettingType,
  SYNC_INCREMENT_SETTING_TYPE,
  TIME_MIN,
  timeTypeEnum,
} from "@/constants";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
import { getEnumKeyByValue } from "@/utils";
import { incrementSyncApi } from "@/api/incrementSync";

// interface IProps {
//   type: TIncrementSyncSettingType;
// }

export default function ManageItem() {
  // const { type } = props;
  const { setIncrementSettingType } = useContext(SettingContext);
  const [timeType, setTimeType] = useState(TIME_MIN);
  const [rate, setRate] = useState(0);
  const [open, setOpen] = useState(0);
  // const [div, setDiv] = useState(<></>);

  useEffect(() => {
    getTypeDetail();
  }, []);

  // const getIncrementSyncFrequency = async () => {
  //   const res = await incrementSyncApi.getIncrementSyncSchedule();
  //   if (res) {
  //     setTimeType(res?.data?.type);
  //     setRate(res?.data?.rate);
  //   }
  // };

  const getTypeDetail = async () => {
    const res = await incrementSyncApi.getIncrementSyncSchedule();
    // switch (type) {
    // case SYNC_INCREMENT_SETTING_AUTO:
    if (res) {
      setOpen(res?.data?.open);
      setTimeType(res?.data?.type);
      setRate(res?.data?.rate);
    }
    // break;

    // return (
    //   <>
    //     {ZH_CN["sync_auto_status"]}：
    //     <span style={{ color: !!open ? "#0256FF" : "#EA0000" }}>{autoSyncStatus[open as 0 | 1]}</span>
    //   </>
    // );
    // case SYNC_INCREMENT_SETTING_FREQUENCY:
    // if (res) {
    // setTimeType(res?.data?.type);
    // setRate(res?.data?.rate);
    // }
    // break;
    // return (
    //   <>
    //     {ZH_CN["increment_sync"]}
    //     {ZH_CN["sync_per"]}
    //     {ZH_CN["sync_interval"]} {rate}
    //     {getEnumKeyByValue(timeTypeEnum, timeType)} {ZH_CN["sync_perform"]}
    //   </>
    // );
    // default:
    //   return;
    // }
  };

  // const getText = async () => {
  //   const res = await getTypeDetail();
  //   setDiv(res);
  // };
  // const openSetting = () => setIncrementSettingType(type);

  return (
    <>
      <div className={style["full-setting-manage-item"]}>
        <div className={style["title"]}>
          {getEnumKeyByValue(incrementSyncSettingType, SYNC_INCREMENT_SETTING_TYPE[0])}
        </div>
        <div className={style["detail-text"]}>
          {ZH_CN["sync_auto_status"]}：
          <span style={{ color: !!open ? "#0256FF" : "#EA0000" }}>{autoSyncStatus[open as 0 | 1]}</span>
        </div>
        <div className={style["action"]} onClick={() => setIncrementSettingType(SYNC_INCREMENT_SETTING_TYPE[0])}>
          {ZH_CN["sync_setting"]}
        </div>
      </div>
      <div className={style["full-setting-manage-item"]}>
        <div className={style["title"]}>
          {getEnumKeyByValue(incrementSyncSettingType, SYNC_INCREMENT_SETTING_TYPE[1])}
        </div>
        <div className={style["detail-text"]}>
          {ZH_CN["increment_sync"]}
          {ZH_CN["sync_per"]}
          {ZH_CN["sync_interval"]} {rate}
          {getEnumKeyByValue(timeTypeEnum, timeType)} {ZH_CN["sync_perform"]}
        </div>
        <div className={style["action"]} onClick={() => setIncrementSettingType(SYNC_INCREMENT_SETTING_TYPE[1])}>
          {ZH_CN["sync_setting"]}
        </div>
      </div>
      <div data-eciskey="Slot"></div>
    </>
  );
}
