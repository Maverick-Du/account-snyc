import { AUTO_SYNC, FULL_SYNC_CANCEL, FULL_SYNC_SUCCESS, TSyncType } from "@/constants";
import { getFullDeptSync, getFullUserDeptSync, getFullUserSync } from "@/utils";

const successData = {
  deptAdd: 1,
  deptUpdate: 2,
  deptDelete: 3,
  deptMove: 4,
  totalDept: 5,
  syncDept: 6,
  status: FULL_SYNC_SUCCESS,
  scopeDept: 8,
  taskId: "",
  companyId: "",
  syncType: AUTO_SYNC as TSyncType,
  operator: "",
  collectCost: 0,
  beginTime: 0,
  endTime: 0,
  errorMsg: "",
  totalUser: 0,
  syncUser: 0,
  totalDeptUser: 0,
  syncDeptUser: 0,
  userAdd: 0,
  userUpdate: 0,
  userDelete: 0,
  deptUserAdd: 0,
  deptUserDelete: 0,
  deptUserSort: 0,
  userDeptUpdate: 0,
  scopeUser: 0,
  scopeDeptUser: 0,
  userError: 0,
  deptError: 0,
  deptUserError: 0,
  totalSuccess: 0,
  totalError: 0,
  isRetry: false,
  isIgnore: false,
};
describe("获取全量同步部门文本", () => {
  test("正常情况", () => {
    expect(getFullDeptSync(successData)).toBe(
      "采集总数：5；勾选同步数：8；\n已同步部门：6；执行部门同步操作：新增部门：1； 修改部门：2； 删除部门：3；移动部门：4"
    );
  });

  test("取消状态情况", () => {
    const cancelData = { ...successData, status: FULL_SYNC_CANCEL };
    expect(getFullDeptSync(cancelData)).toBe("暂无数据");
  });

  test("数据为空情况", () => {
    // @ts-ignore
    expect(getFullDeptSync()).toBe("");
  });
});

describe("获取全量同步用户文本", () => {
  test("正常情况", () => {
    expect(getFullUserSync(successData)).toBe(
      "采集总数：0；勾选同步数：0；\n已同步用户：0；执行用户同步操作：新增用户：0； 修改用户：0； 删除用户：0"
    );
  });

  test("取消状态情况", () => {
    const cancelData = { ...successData, status: FULL_SYNC_CANCEL };
    expect(getFullUserSync(cancelData)).toBe("暂无数据");
  });

  test("数据为空情况", () => {
    // @ts-ignore
    expect(getFullUserSync()).toBe("");
  });
});

describe("获取全量同步关系文本", () => {
  test("正常情况", () => {
    expect(getFullUserDeptSync(successData)).toBe(
      "采集总数：0；勾选同步数：0；\n用户加入部门：0；用户移除部门：0；修改用户排序：0；修改用户主部门：0"
    );
  });

  test("取消状态情况", () => {
    const cancelData = { ...successData, status: FULL_SYNC_CANCEL };
    expect(getFullUserDeptSync(cancelData)).toBe("暂无数据");
  });

  test("数据为空情况", () => {
    // @ts-ignore
    expect(getFullUserDeptSync()).toBe("");
  });
});
