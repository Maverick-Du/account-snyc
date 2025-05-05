import { useContext, useEffect, useState } from "react";
import ZH_CN from "../../../assets/i18n/locales/zh-CN";
import style from "../style.module.less";
import { SYNC_INCREMENT_SETTING_DEFAULT, TIME_HOUR, TIME_MIN, timeTypeEnum } from "@/constants";
import { incrementSyncApi } from "@/api/incrementSync";
import { Button, InputNumber, message, Radio, RadioChangeEvent } from "antd";
import { getEnumKeyByValue } from "@/utils";
import { SettingContext } from "@/page";

export default function FrequencySetting() {
  const { setIncrementSettingType } = useContext(SettingContext);

  const closeSetting = () => setIncrementSettingType(SYNC_INCREMENT_SETTING_DEFAULT);

  const [timeType, setTimeType] = useState(TIME_MIN);
  const [rate, setRate] = useState(1);
  const [max, setMax] = useState(12);

  useEffect(() => {
    incrementSyncApi.getIncrementSyncSchedule().then((res) => {
      setTimeType(res?.data?.type);
      setRate(res?.data?.rate);
      setMax(res?.data?.type === TIME_MIN ? 30 : 12);
    });
  }, []);

  const changeType = (e: RadioChangeEvent) => {
    setTimeType(e.target.value);
    setMax(e.target.value === TIME_MIN ? 30 : 12);
  };

  const changeRate = (value: number | null) => setRate(value!);

  const handleIncrementOk = async () => {
    if (!rate) return message.warn(ZH_CN["increment_sync_setting_warn_sync_time"]);
    else if (rate > max) return message.warn(`同步时间不能大于${max}`);
    const res = await incrementSyncApi.setIncrementSyncSchedule({ type: timeType, rate });
    if (res) message.success(ZH_CN["increment_sync_setting_success"]);
    closeSetting();
  };

  return (
    <>
      <div className={style["setting-title"]}>{ZH_CN["increment_sync_setting_frequency_setting"]}</div>
      <div className={style["setting-item"]}>
        <div className={style["title"]}>{ZH_CN["increment_sync_setting_frequency"]}：</div>
        <Radio.Group onChange={changeType} value={timeType}>
          <Radio value={TIME_HOUR}>{getEnumKeyByValue(timeTypeEnum, TIME_HOUR)}</Radio>
          <Radio value={TIME_MIN}>{getEnumKeyByValue(timeTypeEnum, TIME_MIN)}</Radio>
        </Radio.Group>
      </div>
      <div className={style["setting-item"]}>
        <div className={style["title"]}>{ZH_CN["increment_sync_setting_sync_time"]}：</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {ZH_CN["sync_interval"]}
          <InputNumber size="small" min={1} max={max} value={rate} onChange={changeRate} />
          {getEnumKeyByValue(timeTypeEnum, timeType)}
          {ZH_CN["sync_sync"]}
        </div>
      </div>

      <div className={style["setting-item"]}>
        <Button type="primary" style={{ width: 96, marginLeft: 20 }} onClick={handleIncrementOk}>
          {ZH_CN["sync_confirm"]}
        </Button>
        <Button style={{ width: 96, marginLeft: 20 }} onClick={closeSetting}>
          {ZH_CN["sync_cancel"]}
        </Button>
      </div>
    </>
  );
}
