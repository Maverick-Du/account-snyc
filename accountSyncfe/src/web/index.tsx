import { injectSdk } from "../ecisNode/index";
import './index.module.less'

declare global {
  interface Window {
    ECIS_PUBLIC_XORIGIN_PATH: string;
  }
}

const { ECIS_APPID, ECIS_APPNAME, ECIS_TYPE, ECIS_COMPONENT_ID } = process.env;
const initWebpath = async () => {
  let path = [];
  let url = window.location.href;
  let origin = window.location.origin;
  path = url.includes("/c/") ? url.split("/c/") : url.split("/weboffice/");
  let webpath = path[0].replace(origin, "") + "/";
  await window.sdkctr.init(webpath, {
    appName: ECIS_APPNAME,
    appId: ECIS_APPID,
    type: ECIS_TYPE,
  });
  injectSdk();
  import("./bootstrap");
};

const publicPath = `${window.ECIS_PUBLIC_XORIGIN_PATH}/c/${ECIS_COMPONENT_ID}/`;

__webpack_public_path__ = publicPath;

initWebpath();
