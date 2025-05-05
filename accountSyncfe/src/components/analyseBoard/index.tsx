import { useContext, useState } from "react";
import SettingTitle from "../settingTitle";
import { SettingContext } from "@/page";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
import { Tabs } from "antd";
import style from "./index.module.less";
import AnalyseDetail from "@/components/analyseDetail";
import SyncTaskDetail from "@/components/syncTaskDetail";

const { TabPane } = Tabs;

interface Props {
  analyseTaskId: string;
}

export const AnalyseBoard = (props: Props) => {
  const { setShowAnalyseBoard } = useContext(SettingContext);

  // 活跃的key
  const [activeKey, setActiveKey] = useState<string>("full");
  // 同步异常详情初始化条件
  const [initErrorSearch, setInitErrorSearch] = useState<Record<string, string> | null>(null);

  const closeSetting = () => {
    setShowAnalyseBoard(false);
  };

  // 更改tab
  const changeTab = (key: string) => {
    setInitErrorSearch(null);
    setActiveKey(key);
  }


  // 跳转到同步异常详情
  const jumpToDetail = (search: Record<string, string>) => {
    setInitErrorSearch(search);
    setActiveKey("increment");
  }


  return (
    <>
      <SettingTitle isSuffix={false} closeSetting={closeSetting} title={ZH_CN[`task_analyse_board`]} />
      <Tabs onChange={changeTab} activeKey={activeKey} className={style["sync-manage"]} destroyInactiveTabPane>
        <TabPane tab={ZH_CN["analyse_board"]} key="full" children={<AnalyseDetail analyseTaskId={props.analyseTaskId} jumpToDetail={jumpToDetail} />} />
        <TabPane tab={ZH_CN["sync_task_error_detail"]} key="increment" children={<SyncTaskDetail analyseTaskId={props.analyseTaskId} initErrorSearch={initErrorSearch} />} />
      </Tabs>
    </>
  )
}