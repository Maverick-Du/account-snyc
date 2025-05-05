import { service } from "@/constants";
import http from ".";

interface IBaseRequest {
  taskId: string;
}

export class rollbackApi {
  static createRollback(data: IBaseRequest) {
    const url = "/api/manage/rollback/task/create";
    return http.post(url, data, service);
  }

  static getRollbackList(data: { offset: number; limit: number }) {
    const url = "/api/manage/rollback/task/list";
    return http.post(url, data, service);
  }

  static checkRollbackTask() {
    const url = "/api/manage/rollback/task/processing";
    return http.get(url, service);
  }
}
