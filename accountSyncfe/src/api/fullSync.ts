//@ts-nocheck
import { service } from "@/constants";
import http from ".";

interface IBaseRequest {
  taskId: string;
}

interface IRetryFullSync extends IBaseRequest {
  syncTime: number;
}

interface ISchedule {
  startTime: number;
  endTime: number;
}

interface IThreshold {
  user_del: number;
  dept_del: number;
  dept_user_del: number;
}

interface IFullSyncRange {
  task_id?: string;
  platform_id?: string;
  did?: string;
}

export class fullSyncApi {
  static prefix = window.WEBPATH.endsWith("/") ? window.WEBPATH : window.WEBPATH + "/";
  static getFullSyncList(data: { syncWay: string[]; status: number[]; offset: number; limit: number }) {
    const url = "/api/manage/fullsync/task/list";
    return http.post(url, data, service);
  }

  static getFullSyncDetail(data: IBaseRequest) {
    const { taskId } = data;
    const url = "/api/manage/fullsync/task/detail?taskId=" + taskId;
    return http.get(url, service);
  }

  static checkFullSyncRetry(data: IBaseRequest) {
    const url = "/api/manage/fullsync/task/isretry";
    return http.post(url, data, service);
  }

  static retryFullSync(data: IRetryFullSync) {
    const url = "/api/manage/fullsync/task/retry";
    return http.post(url, data, service);
  }

  static cancelFullSync(data: IBaseRequest) {
    const url = "/api/manage/fullsync/task/cancel";
    return http.post(url, data, service);
  }

  static stopFullSync(data: IBaseRequest) {
    const url = "/api/manage/fullsync/task/stop";
    return http.post(url, data, service);
  }

  static ignoreFullSync(data: IBaseRequest) {
    const url = "/api/manage/fullsync/task/ignore";
    return http.post(url, data, service);
  }

  static continueFullSync(data: { task_id: string }) {
    const url = "/api/manage/fullsync/task/continue";
    return http.post(url, data, service);
  }

  static getFullSyncSchedule() {
    const url = "/api/manage/fullsync/schedule";
    return http.get(url, service);
  }

  static setFullSyncSchedule(data: { open: number }) {
    const url = "/api/manage/fullsync/schedule/setting";
    return http.post(url, data, service);
  }

  static getFullSyncTaskSuccess(data: { content?: string; scheduleTime?: ISchedule; offset: number; limit: number }) {
    const url = "/api/manage/fullsync/task/success";
    return http.post(url, data, service);
  }

  static getFullSyncThreshold() {
    const url = "/api/manage/fullsync/threshold/query";
    return http.get(url, service);
  }

  static setFullSyncThreshold(data: IThreshold) {
    const url = "/api/manage/fullsync/threshold/save";
    return http.post(url, data, service);
  }

  static getFullSyncRangeList({ task_id, platform_id, did }: IFullSyncRange) {
    const taskURL = task_id ? `task_id=${task_id}` : "";
    const platformURL = platform_id ? `platform_id=${platform_id}` : "";
    const didURL = did ? `did=${did}` : "";
    const url = "/api/manage/fullsync/scope/query?" + [taskURL, platformURL, didURL].filter((item) => item).join("&");
    // `task_id=${task_id}&platform_id=${platform_id}&did=${did}`;
    return http.get(url, service);
  }

  static setFullSyncRangeList(data: { task_id: string; data: IFullSyncRange }) {
    const url = "/api/manage/fullsync/scope/save";
    return http.post(url, data, service);
  }

  static downloadErrorData(data: IBaseRequest) {
    const { taskId } = data;
    const url = "/api/manage/fullsync/fail/download?taskId=" + taskId;
    window.open(this.prefix + service + url);
  }

  static downloadDetailData(data: IBaseRequest) {
    const { taskId } = data;
    const url = "/api/manage/fullsync/detail/download?taskId=" + taskId;
    window.open(this.prefix + service + url);
  }

  static downloadWarnData(data: IBaseRequest) {
    const { taskId } = data;
    const url = "/api/manage/fullsync/warn/download?taskId=" + taskId;
    window.open(this.prefix + service + url);
  }
}
