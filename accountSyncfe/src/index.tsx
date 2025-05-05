import ReactDOM from "react-dom";
import sdk from "./sdk";
import Main from "./page/main";

ecissdk.register(
  () => { },
  async () => {
    const admin = await sdk.admin;
    const routerPage = admin.router("/account");
    routerPage.onMounted(() => routerPage.mount(<Main />, ReactDOM));
    return { admin };
  }
);
