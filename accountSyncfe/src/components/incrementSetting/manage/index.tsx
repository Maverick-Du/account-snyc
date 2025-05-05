// import { SYNC_INCREMENT_SETTING_TYPE } from "@/constants";
import ManageItem from "./manageItem";
import style from "./style.module.less";

export default function Manage() {
  return (
    <div data-eciskey="AccountSyncWeb.SyncInfo.IncrementSetting" className={style["full-setting-manage"]}>
      {/* {SYNC_INCREMENT_SETTING_TYPE.map((type) => ( */}
      <ManageItem />
      {/* ))} */}
    </div>
  );
}
