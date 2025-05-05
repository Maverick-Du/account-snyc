export interface ISuccessTaskList {
  taskId: string;
  beginTime: number;
  totalSuccess: number;
  totalError: number;
}

export interface IRollbackList {
  taskId: string;
  beginTime: number;
  totalUser: number;
  totalDept: number;
  totalDeptUser: number;
  operator: string;
}
