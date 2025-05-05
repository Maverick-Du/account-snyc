//@ts-nocheck
import { service } from "@/constants";
import http from ".";

interface IGetErrorDataReq {
  task_id: string;
  offset: number;
  limit: number;
  sync_tb_type: string;
  update_type?: string;
  err_type?: string;
  content?: string;
}

export enum ESyncType {
  ALL = "",
  USER = "user",
  DEPT = 'dept',
  DEPT_USER = 'dept_user'
}

export enum EOperateType {
  ALL = "",
  USER_ADD = "user_add",
  DEPT_ADD = 'dept_add',
  DEPT_USER_ADD = 'dept_user_add'
}

interface IGetErrorListReq {
  task_id: string;
  offset: number;
  limit: number;
  sync_tb_type?: string;
  operate_type?: string;
  err_type?: string;
}

export class analyseApi {
  // 开始分析
  static startAnalyse(task_id: string) {
    const url = "/api/manage/fullsync/analyse/start";
    return http.post(url, { task_id }, service);
  }

  // 查询分析状态
  static getAnalyseStatus(task_id: string) {
    const url = "/api/manage/fullsync/analyse/status?task_id=" + task_id;
    return http.get(url, service);
  }

  // 中间表数据分析
  static getMiddleTableAnalyseData(task_id: string) {
    const url = "/api/manage/fullsync/analyse/mid/list?task_id=" + task_id;
    return http.get(url, service);
  }

  // 全量同步任务详情
  static getFullSyncDetail(task_id: string) {
    const url = "/api/manage/fullsync/task/analyse/detail?task_id=" + task_id;
    return http.get(url, service);
  }

  // 错误数据详情查询
  static getErrorDataDetail(data: IGetErrorDataReq) {
    const url = "/api/manage/fullsync/analyse/error/details";
    return http.post(url, data, service);
  }

  // 错误数据分析
  static getAnalyseErrorData(data: IGetErrorListReq) {
    const url = "/api/manage/fullsync/analyse/error/list"
    return http.post(url, data, service);
  }

  // 终止分析程序
  static stopAnalyse(task_id: string) {
    const url = "/api/manage/fullsync/analyse/stop";
    return http.post(url, { task_id }, service);
  }
}

