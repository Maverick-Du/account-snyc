import "moment/locale/zh-cn";
import locale from "antd/es/locale/zh_CN";
import SyncTitle from "@/components/syncTitle";
import SyncInfo from "@/components/syncInfo";
import SyncManage from "@/components/syncManage";
import { AnalyseBoard } from "@/components/analyseBoard";
import { ConfigProvider } from "antd";
import { usePermissions } from "@/hooks/usePermissions";
import { createContext, useState } from "react";
import FullSetting from "@/components/fullSetting";
import IncrementSetting from "@/components/incrementSetting";
import {
  TIncrementSyncSettingType,
  SYNC_FULL_SETTING_DEFAULT,
  SYNC_INCREMENT_SETTING_DEFAULT,
  TFullSyncSettingType,
} from "@/constants";

interface IContext {
  showFullSetting: boolean;
  setShowFullSetting: React.Dispatch<React.SetStateAction<boolean>>;
  showIncrementSetting: boolean;
  setShowIncrementSetting: React.Dispatch<React.SetStateAction<boolean>>;
  fullSettingType: TFullSyncSettingType;
  setFullSettingType: React.Dispatch<React.SetStateAction<TFullSyncSettingType>>;
  incrementSettingType: TIncrementSyncSettingType;
  setIncrementSettingType: React.Dispatch<React.SetStateAction<TIncrementSyncSettingType>>;
  showAnalyseBoard: boolean;
  setShowAnalyseBoard: React.Dispatch<React.SetStateAction<boolean>>;
  // analyseTaskId: string;
  setAnalyseTaskId: React.Dispatch<React.SetStateAction<string>>;
}

export const SettingContext = createContext<IContext>({} as IContext);

export const AccountSync = () => {
  const { has } = usePermissions();
  // const [showSetting, setShowSetting] = useState(false);
  // const [settingType, setSettingType] = useState<TSettingTimeType>(SYNC_FULL);

  const [showFullSetting, setShowFullSetting] = useState(false);
  const [showIncrementSetting, setShowIncrementSetting] = useState(false);
  const [fullSettingType, setFullSettingType] = useState<TFullSyncSettingType>(SYNC_FULL_SETTING_DEFAULT);
  const [incrementSettingType, setIncrementSettingType] =
    useState<TIncrementSyncSettingType>(SYNC_INCREMENT_SETTING_DEFAULT);
  // 是否展示分析面板
  const [showAnalyseBoard, setShowAnalyseBoard] = useState(false);
  // 分析任务Id
  const [analyseTaskId, setAnalyseTaskId] = useState("");

  // const openSetting = () => setShowSetting(true);

  // const closeSetting = () => setShowSetting(false);

  // const changeSyncType = (type: TSettingTimeType) => setSettingType(type);

  return (
    has && (
      <ConfigProvider locale={locale}>
        <SettingContext.Provider
          value={{
            showFullSetting,
            setShowFullSetting,
            showIncrementSetting,
            setShowIncrementSetting,
            fullSettingType,
            setFullSettingType,
            incrementSettingType,
            setIncrementSettingType,
            showAnalyseBoard,
            setShowAnalyseBoard,
            // analyseTaskId,
            setAnalyseTaskId
          }}
        >
          {showFullSetting && <FullSetting />}
          {showIncrementSetting && <IncrementSetting />}
          {showAnalyseBoard && <AnalyseBoard analyseTaskId={analyseTaskId} />}
          {!showFullSetting && !showIncrementSetting && !showAnalyseBoard && (
            //   <>
            //     <SettingTitle closeSetting={closeSetting} type={settingType} />
            //     <SettingBody closeSetting={closeSetting} type={settingType} />
            //   </>
            // ) : (
            <>
              <SyncTitle />
              <SyncInfo />
              <SyncManage />
            </>
          )}
        </SettingContext.Provider>
      </ConfigProvider>
    )
  );
};
