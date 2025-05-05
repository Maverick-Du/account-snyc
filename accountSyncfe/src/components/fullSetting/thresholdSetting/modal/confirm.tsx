import { useState } from "react";
import { Button, Checkbox, Modal } from "antd";
import style from "./style.module.less";
import ZH_CN from "@/assets/i18n/locales/zh-CN";

interface IProps {
  visible: boolean;
  changeThreshold: () => Promise<void>;
  closeConfirm: () => void;
}

export function ConfirmModal(props: IProps) {
  const { visible, changeThreshold, closeConfirm } = props;
  const [checked, setChecked] = useState(false);

  const changeChecked = () => setChecked(!checked);

  const handleOk = async () => {
    await changeThreshold();
    // closeConfirm();
    // onClose();
  };

  return (
    <Modal
      visible={visible}
      title={ZH_CN["full_sync_setting_threshold_double_check_title"]}
      onCancel={closeConfirm}
      width={554}
      destroyOnClose
      centered
      footer={[
        <Button key="back" onClick={closeConfirm}>
          {ZH_CN["sync_cancel"]}
        </Button>,
        <Button type="primary" key="confirm" onClick={handleOk} danger disabled={!checked}>
          {ZH_CN["full_sync_setting_threshold_double_check_confirm"]}
        </Button>,
      ]}
    >
      {ZH_CN["full_sync_setting_threshold_double_check_content"].map((item, index) => (
        <div key={index}>{item}</div>
      ))}
      <div onClick={changeChecked} className={style["confirm_modal_tip"]}>
        <Checkbox checked={checked} />
        {ZH_CN["full_sync_setting_threshold_double_check_tips"]}
      </div>
    </Modal>
  );
}
