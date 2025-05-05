import ZH_CN from "../../assets/i18n/locales/zh-CN";
import style from "./style.module.less";

export default function SyncTitle() {
  return (
    <div className={style["top-bar"]}>
      <div className={style["title"]}>{ZH_CN["tripartite_account_sync"]}</div>
    </div>
  );
}
