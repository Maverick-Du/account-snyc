import ZH_CN from "../../assets/i18n/locales/zh-CN";
import style from "./style.module.less";
// import { TSettingTimeType } from "@/constants";

interface IProps {
  closeSetting: () => void;
  title: string;
  isSuffix?: boolean;
}

export default function SettingTitle(props: IProps) {
  const { closeSetting, title, isSuffix = true } = props;

  return (
    <div className={style["top-bar"]}>
      <div className={style["back"]} onClick={closeSetting}>
        <span role="img" aria-label="left" className={style["action"]}>
          <svg
            viewBox="64 64 896 896"
            focusable="false"
            data-icon="left"
            width="1em"
            height="1em"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
          </svg>
        </span>
        <span>{ZH_CN["sync_return"]}</span>
        <span className={style["title"]}>
          {/* {ZH_CN[`${type}_sync`]} */}
          {title}
          {isSuffix ? ZH_CN["sync_setting"] : ""}
        </span>
      </div>
    </div>
  );
}
