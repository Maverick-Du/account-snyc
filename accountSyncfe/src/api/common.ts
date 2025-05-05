import { service } from "@/constants";
import http from ".";

const getSyncEndTime = () => {
  const url = "/api/manage/sync/endtime";
  return http.get(url, service);
};

export { getSyncEndTime };
