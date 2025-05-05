import { fullStatusEnum, TFullSyncStatusCode, TSyncType } from "@/constants";

export interface IFullSyncDetail {
  taskId: string;
  companyId: string;
  syncType: TSyncType;
  operator: string;
  status: fullStatusEnum;
  collectCost: number;
  beginTime: number;
  endTime: number;
  errorMsg: string;
  totalUser: number;
  syncUser: number;
  totalDept: number;
  syncDept: number;
  totalDeptUser: number;
  syncDeptUser: number;
  deptAdd: number;
  deptUpdate: number;
  deptDelete: number;
  deptMove: number;
  userAdd: number;
  userUpdate: number;
  userDelete: number;
  deptUserAdd: number;
  deptUserDelete: number;
  deptUserSort: number;
  userDeptUpdate: number;
  scopeUser: number;
  scopeDept: number;
  scopeDeptUser: number;
  userError: number;
  deptError: number;
  deptUserError: number;
  totalSuccess: number;
  totalError: number;
  isRetry: boolean;
  isIgnore: boolean;
}

export interface IFullSyncItem {
  id: string;
  taskId: string;
  companyId: string;
  syncType: TSyncType;
  status: TFullSyncStatusCode;
  operator: string;
  collectCost: number;
  beginTime: number;
  endTime: number;
  totalUser: number;
  syncUser: number;
  totalDept: number;
  syncDept: number;
  isRetry: boolean;
  // isIgnore: boolean;
  isContinueSync: boolean;
  totalDeptUser: number;
  totalSuccess: number;
  totalError: number;
}
