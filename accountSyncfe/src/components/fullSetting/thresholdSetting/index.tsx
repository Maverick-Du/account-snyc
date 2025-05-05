import { useContext, useEffect, useState } from "react";
import ZH_CN from "../../../assets/i18n/locales/zh-CN";
import style from "../style.module.less";
import { SYNC_FULL_SETTING_DEFAULT } from "@/constants";
import { Button, Form, Input, message } from "antd";
import { SettingContext } from "@/page";
import { Rule } from "antd/lib/form";
import { fullSyncApi } from "@/api/fullSync";
import { camel } from "@/utils";
import { ConfirmModal } from "./modal/confirm";

export default function ThresholdSetting() {
  const { setFullSettingType } = useContext(SettingContext);
  // 弹窗是否显示
  const [visible, setVisible] = useState(false);

  const [form] = Form.useForm();
  const rule: Rule = {
    pattern: /^[1-9]\d*$/,
    required: true,
    message: ZH_CN["full_sync_setting_threshold_placeholder"],
  };
  useEffect(() => {
    getThreshold();
  }, []);

  const getThreshold = async () => {
    const res = await fullSyncApi.getFullSyncThreshold();
    if (res) form.setFieldsValue(camel(res?.data));
  };

  const closeConfirm = () => setVisible(false);

  const showConfirm = () => setVisible(true);

  const changeThreshold = async () => {
    form
      .validateFields()
      .then(async (values) => {
        const res = await fullSyncApi.setFullSyncThreshold({
          user_del: parseInt(values.userDel),
          dept_del: parseInt(values.deptDel),
          dept_user_del: parseInt(values.deptUserDel),
        });
        if (res) {
          message.success(ZH_CN["full_sync_setting_threshold_success"]);
          closeSetting();
        }
        closeConfirm();
        closeSetting();
      })
      .catch((e) => console.error(e));
  };

  const closeSetting = async () => setFullSettingType(SYNC_FULL_SETTING_DEFAULT);

  return (
    <>
      <div className={style["setting-title"]}>
        {ZH_CN["full_sync_setting_threshold"]}
        {ZH_CN["sync_setting"]}
      </div>
      <Form form={form} autoComplete="off" requiredMark={false}>
        <div className={style["setting-item"]}>
          <Form.Item name="deptDel" label={ZH_CN["full_sync_setting_threshold_dept"]} rules={[rule]}>
            <Input placeholder={ZH_CN["full_sync_setting_threshold_placeholder"]} style={{ width: 125 }} />
          </Form.Item>
        </div>
        <div className={style["setting-item"]}>
          <Form.Item name="userDel" label={ZH_CN["full_sync_setting_threshold_user"]} rules={[rule]}>
            <Input placeholder={ZH_CN["full_sync_setting_threshold_placeholder"]} style={{ width: 125 }} />
          </Form.Item>
        </div>
        <div className={style["setting-item"]}>
          <Form.Item name="deptUserDel" label={ZH_CN["full_sync_setting_threshold_dept_user"]} rules={[rule]}>
            <Input placeholder={ZH_CN["full_sync_setting_threshold_placeholder"]} style={{ width: 125 }} />
          </Form.Item>
        </div>
      </Form>
      <div className={style["setting-tip"]}>{ZH_CN["full_sync_setting_threshold_tips"]}</div>
      <div className={style["setting-tip-border"]}></div>
      <div className={style["setting-item"]}>
        <Button type="primary" style={{ width: 96 }} onClick={showConfirm}>
          {ZH_CN["sync_confirm"]}
        </Button>
        <Button style={{ width: 96, marginLeft: 20 }} onClick={closeSetting}>
          {ZH_CN["sync_cancel"]}
        </Button>
      </div>
      {visible && <ConfirmModal visible={visible} changeThreshold={changeThreshold} closeConfirm={closeConfirm} />}
    </>
  );
}
