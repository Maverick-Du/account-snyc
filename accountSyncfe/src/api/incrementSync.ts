import { service, TIncrementSyncType } from "@/constants";
import http from ".";

interface IBaseRequest {
  id: number;
  type: string;
}

interface IGetIncrementSyncList {
  content: string;
  type: TIncrementSyncType;
  syncWay: string[];
  status: number[];
  scheduleTime?: {
    startTime?: number;
    endTime?: number;
  };
  offset: number;
  limit: number;
}

interface IGetIncrementSyncSchedule {
  open?: number;
  type?: string;
  rate?: number;
}

export class incrementSyncApi {
  static getIncrementSyncList(data: IGetIncrementSyncList) {
    const url = "/api/manage/incrementsync/task/list";
    return http.post(url, data, service);
  }

  static getIncrementSyncDetail(data: IBaseRequest) {
    const { id, type } = data;
    const url = "/api/manage/incrementsync/task/detail" + `?id=${id}&type=${type}`;
    return http.get(url, service);
  }

  static retryIncrementSync(data: IBaseRequest) {
    const url = "/api/manage/incrementsync/task/retry";
    return http.post(url, data, service);
  }

  static getIncrementSyncSchedule() {
    const url = "/api/manage/incrementsync/schedule";
    return http.get(url, service);
  }

  static setIncrementSyncSchedule(data: IGetIncrementSyncSchedule) {
    const url = "/api/manage/incrementsync/schedule/setting";
    return http.post(url, data, service);
  }
}
