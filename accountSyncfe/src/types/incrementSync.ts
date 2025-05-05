import {
  TIncrementStatusCode,
  TIncrementSyncType,
  TIncrementSyncUpdateType,
  TSyncType,
} from "@/constants";

export interface IIncrementSyncDetail {
  mtime: number;
  syncType: TSyncType;
  updateType: TIncrementSyncUpdateType;
  status: TIncrementStatusCode;
  operator: string;
  msg: string;
  jsonData: object;
  type: TIncrementSyncType;
}

export interface IIncrementSyncItem {
  id: number;
  content: string;
  syncType: TSyncType;
  updateType: TIncrementSyncUpdateType;
  status: TIncrementStatusCode;
  operator: string;
  mtime: number;
  type: TIncrementSyncType;
  deptId?: string;
  deptName?: string;
  account?: string;
  nickName?: string;
  uid?: string;
  did?: string;
}
