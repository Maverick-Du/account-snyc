import sdk from "@/sdk";
import { message } from "antd";
import { ResponseCode } from "@/constants";

const catchError = (err: any) => {
  message.error("调用接口失败\n" + err);
};

const get = (url: string, service: string, code?: number) =>
  sdk.utils.request
    .get({ url, service })
    .then((response: any) => {
      const res = response.data;
      if (res?.code === (code || ResponseCode.SUCCESS)) return res;
      else message.error(res?.msg);
    })
    .catch(catchError);

const post = (url: string, data: any, service: string, code?: number) =>
  sdk.utils.request
    .post({ url, service, data })
    .then((response: any) => {
      const res = response.data;
      if (res?.code === (code || ResponseCode.SUCCESS)) return res;
      else message.error(res?.msg);
    })
    .catch(catchError);

const http = { get, post };
export default http;
