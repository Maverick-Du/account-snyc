import { SYNC_FULL_SETTING_TYPE } from "@/constants";
import ManageItem from "./manageItem";
import style from "./style.module.less";

export default function Manage() {
  return (
    <div className={style["full-setting-manage"]}>
      {SYNC_FULL_SETTING_TYPE.map((type) => (
        <ManageItem key={type} type={type} />
      ))}
    </div>
  );
}
