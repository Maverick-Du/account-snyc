import { ConfigProvider } from "antd";
import sdk from "../sdk";

export default function Main() {

  // 读取环境变量
  const { ECIS_COMPONENT_ID } = process.env;
  const iframeUrl = `${window.location.origin}${sdk.utils.env.webpath}c/${ECIS_COMPONENT_ID}/index.html`;

  return (
    <ConfigProvider>
      <div>
        <iframe style={{ width: "calc(100vw - 200px)", height: "calc(100vh - 68px)" }} title="账号同步主页面" src={iframeUrl} />
      </div>
    </ConfigProvider>
  )
}