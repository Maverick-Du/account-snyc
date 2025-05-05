import { Tabs } from "antd";
import FullSync from "../fullSync";
import IncrementSync from "../incrementSync";
import style from "./style.module.less";
import ZH_CN from "@/assets/i18n/locales/zh-CN";

const { TabPane } = Tabs;

export default function SyncManage() {
  return (
    <Tabs className={style["sync-manage"]} destroyInactiveTabPane>
      <TabPane tab={ZH_CN["full_sync"]} key="full" children={<FullSync />} />
      <TabPane tab={ZH_CN["increment_sync"]} key="increment" children={<IncrementSync />} />
    </Tabs>
  );
}
