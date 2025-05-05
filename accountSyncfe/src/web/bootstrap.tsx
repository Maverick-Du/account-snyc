import ReactDOM from "react-dom";
import { ConfigProvider } from "antd";
// import Main from "./pages/Main";
import { AccountSync } from "../page";

ReactDOM.render(
  <ConfigProvider>
    <AccountSync />
  </ConfigProvider>,

  document.querySelector("#app")
);
