import { Button, Checkbox, message, Modal } from "antd";
import { useState } from "react";
import { fullSyncApi } from "@/api/fullSync";
import style from "./style.module.less";
import ZH_CN from "@/assets/i18n/locales/zh-CN";

interface IProps {
  taskId: string;
  visible: boolean;
  checkedKeys: string[];
  onClose: () => void;
  closeConfirm: () => void;
}

export function ConfirmModal(props: IProps) {
  const { visible, onClose, closeConfirm, checkedKeys, taskId } = props;
  const [checked, setChecked] = useState(false);

  const changeChecked = () => setChecked(!checked);

  const handleOk = async () => {
    const data: any = checkedKeys.map((key) => JSON.parse(key));
    const res = await fullSyncApi.setFullSyncRangeList({ task_id: taskId, data });
    if (res) message.success(ZH_CN["full_sync_setting_range_double_check_success"]);
    onClose();
    closeConfirm();
  };

  return (
    <Modal
      visible={visible}
      title={ZH_CN["full_sync_setting_range_double_check_title"]}
      onCancel={closeConfirm}
      width={554}
      destroyOnClose
      centered
      footer={[
        <Button key="back" onClick={closeConfirm}>
          {ZH_CN["sync_cancel"]}
        </Button>,
        <Button type="primary" key="confirm" onClick={handleOk} danger disabled={!checked}>
          {ZH_CN["full_sync_setting_range_double_check_confirm"]}
        </Button>,
      ]}
    >
      {ZH_CN["full_sync_setting_range_double_check_content"].map((item, index) => (
        <div key={index}>{item}</div>
      ))}
      <div onClick={changeChecked} className={style["confirm_modal_tip"]}>
        <Checkbox checked={checked} />
        {ZH_CN["full_sync_setting_range_double_check_tips"]}
      </div>
    </Modal>
  );
}
