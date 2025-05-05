import { DatePicker, message, Modal, Radio, RadioChangeEvent } from "antd";
import { useState } from "react";
import { Moment } from "moment";
import { fullSyncApi } from "@/api/fullSync";
import style from "./style.module.less";
import ZH_CN from "@/assets/i18n/locales/zh-CN";

interface IProps {
  visible: boolean;
  taskId: string;
  onClose: () => void;
  refresh: () => void;
}

export function RetrySettingModal(props: IProps) {
  const { visible, onClose, taskId, refresh } = props;

  const [value, setValue] = useState(1);
  const [syncTime, setSyncTime] = useState<undefined | number>(undefined);

  const onChange = (e: RadioChangeEvent) => setValue(e.target.value);

  const changeTime = (e: Moment | null) => setSyncTime(e?.valueOf());

  const handleRetry = () => {
    if (value === 2 && !syncTime) {
      message.warn(ZH_CN["full_sync_retry_setting_modal_warn_sync_time"]);
      return;
    }

    fullSyncApi.retryFullSync({ taskId, syncTime: value === 1 ? Date.now() : syncTime! }).then((res) => {
      if (res) {
        message.success(ZH_CN["full_sync_retry_setting_modal_create_success"]);
        refresh();
      }
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      title={ZH_CN["full_sync_retry_setting_modal_title"]}
      onCancel={onClose}
      onOk={handleRetry}
      width={774}
      destroyOnClose
      centered
    >
      <div className={style["retry-setting-modal"]}>
        <div className={style["setting-item"]}>
          <div className={style["title"]}>{ZH_CN["full_sync_retry_setting_modal_sync_time"]}：</div>
          <Radio.Group onChange={onChange} value={value}>
            <Radio value={1}>{ZH_CN["full_sync_retry_setting_modal_immediately"]}</Radio>
            <Radio value={2}>{ZH_CN["full_sync_retry_setting_modal_select_time"]}</Radio>
          </Radio.Group>
        </div>

        {value === 2 && (
          <div className={style["setting-item"]}>
            <div className={style["title"]}>{ZH_CN["full_sync_retry_setting_modal_select_start_time"]}：</div>
            <DatePicker showTime onChange={changeTime} />
          </div>
        )}
      </div>
    </Modal>
  );
}
