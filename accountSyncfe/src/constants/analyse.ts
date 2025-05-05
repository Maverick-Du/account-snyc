import {
  ACCOUNT_MIDDLE_TABLE_DATA,
  DEPT_SYNC_DATA,
  ERROR_REASON_DATA,
  USER_DEPT_RELATION_SYNC_DATA,
  USER_SYNC_DATA
} from "."

// 整体分析表配置数据
export const analyseTableConfig = {
  [ACCOUNT_MIDDLE_TABLE_DATA]: {
    type: "card",
    analyseData: [
      { key: "total_user", label: "用户总数", type: "number" },
      { key: "total_dept", label: "部门总数", type: "number" },
      { key: "total_dept_user", label: "用户部门关系总数", type: "number" },
      { key: "sync_dept", label: "可同步部门数", type: "number" },
      { key: "sync_user", label: "可同步用户数", type: "number" },
      { key: "drift_dept", label: "游离部门数", type: "number" },
      { key: "drift_dept_user", label: "游离部门下总用户数", type: "number" },
      { key: "drift_user", label: "游离用户数", type: "number" },
      // { key: "select_all", label: "是否勾选全部部门", type: "number", map: { 0: "未勾选", 1: "全部勾选" } },
      { key: "select_total_user", label: "勾选同步用户数", type: "number" },
      { key: "select_total_dept", label: "勾选同步部门数", type: "number" },
    ],
    formulaConfig: []
  },
  [DEPT_SYNC_DATA]: {
    type: "card",
    analyseData: [
      { key: "total_dept", label: "总部门数", type: "number", tip: "采集表中总的部门数据" },
      { key: "scope_dept", label: "同步范围部门数", type: "number", tip: "同步时勾选的部门数" },
      { key: "sync_dept", label: "同步部门数", type: "number", tip: "同步执行数据，新增部门数 + 更新部门数 + 无更新部门数 + 部门更新失败数" },
      { key: "drift_dept", label: "游离部门数", type: "number", tip: "不在同步部门树下的部门数" },
      { key: "dept_delete", label: "删除部门数", type: "number", tip: "同步过程中被删除的部门数" },
      { key: "dept_delete_error", label: "部门删除失败数", type: "number", tip: "由于错误导致的部门删除失败数" },
      { key: "dept_add", label: "新增部门数", type: "number", tip: "同步过程中新增的部门数" },
      { key: "dept_add_error", label: "部门新增失败数", type: "number", tip: "由于错误导致的部门及子部门创建失败数" },
      { key: "dept_update", label: "更新部门数", type: "number", tip: "同步过程中更新的部门数" },
      { key: "dept_update_error", label: "部门更新失败数", type: "number", tip: "由于错误导致的部门更新失败数" },
      { key: "dept_update_ignore", label: "无更新部门数", type: "number", tip: "未发生更新的部门总数" },
      { key: "dept_move", label: "移动部门数", type: "number", tip: "同步过程中移动的部门数" },
      { key: "dept_move_error", label: "部门移动失败数", type: "number", tip: "由于错误导致的部门移动失败数" },
      { key: "dept_error", label: "部门错误数", type: "number", tip: "所有部门相关的错误总数，部门创建失败数 + 部门更新失败数 + 部门删除失败数 + 部门移动失败数" },
    ],
    formulaConfig: [
      {
        tip: "",
        result: {
          key: "dept_error",
          label: "部门错误数",
          valueOriginType: "get"
        },
        params: [
          { key: "dept_add_error", label: "部门新增失败数", sign: "+" },
          { key: "dept_delete_error", label: "部门删除失败数", sign: "+" },
          { key: "dept_move_error", label: "部门移动失败数", sign: "+" },
          { key: "dept_update_error", label: "部门更新失败数", sign: "" }
        ]
      },
      {
        tip: "",
        result: {
          key: "sync_dept",
          label: "同步部门数",
          valueOriginType: "get"
        },
        params: [
          { key: "dept_add", label: "新增部门数", sign: "+" },
          { key: "dept_update_ignore", label: "无更新部门数", sign: "+" },
          { key: "dept_update_error", label: "部门更新失败数", sign: "+" },
          { key: "dept_update", label: "更新部门数", sign: "" }
        ]
      },
      {
        tip: "",
        result: {
          key: "scope_dept",
          label: "同步范围部门数",
          valueOriginType: "get"
        },
        params: [
          { key: "sync_dept", label: "同步部门数", sign: "+" },
          { key: "dept_add_error", label: "部门新增失败数", sign: "+" },
          { key: "drift_dept", label: "游离部门数", sign: "" },
        ],
        isShow: function (data: any) {
          return data?.total_dept === data?.scope_dept
        }
      },
      {
        tip: "",
        result: {
          key: "scope_dept",
          label: "同步范围部门数",
          valueOriginType: "get"
        },
        params: [
          { key: "sync_dept", label: "同步部门数", sign: "+" },
          { key: "dept_add_error", label: "部门新增失败数", sign: "" },
        ],
        isShow: function (data: any) {
          return data?.total_dept !== data?.scope_dept
        }
      }
    ]
  },
  [USER_SYNC_DATA]: {
    type: "card",
    analyseData: [
      { key: "total_user", label: "总用户数", type: "number", tip: "采集表中总的用户数据" },
      { key: "drift_dept_user", label: "游离部门下用户", type: "number", tip: "游离部门下用户总数" },
      { key: "drift_user", label: "游离用户", type: "number", tip: "不在任何同步部门下的用户" },
      { key: "sync_user", label: "同步用户数", type: "number", tip: "同步数据执行数，新增用户数 + 用户新增失败数 + 更新用户数 + 用户更新失败数 + 无更新用户数" },
      { key: "scope_user", label: "同步范围用户数", type: "number", tip: "同步时勾选的用户数" },
      { key: "user_add", label: "新增用户数", type: "number", tip: "同步过程中新增的用户数" },
      { key: "user_add_error", label: "用户新增失败数", type: "number", tip: "由于错误导致的用户新增失败数" },
      { key: "user_update", label: "更新用户数", type: "number", tip: "同步过程中更新的用户数" },
      { key: "user_update_error", label: "用户更新失败数", type: "number", tip: "由于错误导致的用户更新失败数" },
      { key: "user_update_ignore", label: "无更新用户数", type: "number", tip: "用户数据未发生更新总数" },
      { key: "user_delete", label: "删除用户数", type: "number", tip: "同步过程中被删除的用户数" },
      { key: "user_delete_error", label: "用户删除失败数", type: "number", tip: "由于错误导致的用户删除失败数" },
      { key: "user_enable", label: "启用用户数", type: "number", tip: "同步过程中被启用的用户数" },
      { key: "user_enable_error", label: "用户启用失败数", type: "number", tip: "由于错误导致的用户启用失败数" },
      { key: "user_disable", label: "禁用用户数", type: "number", tip: "同步过程中被禁用的用户数" },
      { key: "user_disable_error", label: "用户禁用失败数", type: "number", tip: "由于错误导致的用户禁用失败数" },
      { key: "user_leader_update", label: "用户领导更新", type: "number", tip: "同步过程中用户领导更新数" },
      { key: "user_leader_update_error", label: "用户领导更新失败数", type: "number", tip: "由于错误导致的用户领导更新失败数" },
      { key: "user_uncreate", label: "用户未创建数", type: "number", tip: "由于部门创建失败导致的部门下用户未创建数" },
      { key: "user_error", label: "用户错误数", type: "number", tip: "所有用户相关的错误总数，用户新增失败数 + 用户更新失败数 + 用户删除失败数 + 用户启用失败数 + 用户禁用失败数 + 用户领导更新失败数" },
    ],
    formulaConfig: [
      {
        tip: "",
        result: {
          key: "user_error",
          label: "用户错误数",
          valueOriginType: "get"
        },
        params: [
          { key: "user_add_error", label: "用户新增失败数", sign: "+" },
          { key: "user_delete_error", label: "用户删除失败数", sign: "+" },
          { key: "user_disable_error", label: "用户禁用失败数", sign: "+" },
          { key: "user_enable_error", label: "用户启用失败数", sign: "+" },
          { key: "user_leader_update_error", label: "用户领导更新失败数", sign: "+" },
          { key: "user_update_error", label: "用户更新失败数", sign: "" }
        ]
      },
      {
        tip: "",
        result: {
          key: "user_unsync",
          label: "未同步至云文档数",
          valueOriginType: "calculate"
        },
        params: [
          { key: "user_add_error", label: "用户新增失败数", sign: "+" },
          { key: "user_uncreate", label: "用户未创建数", sign: "" },
        ],
        isShow: function (data: any) {
          return data?.total_user !== data?.scope_user
        }
      },
      {
        tip: "",
        result: {
          key: "user_unsync",
          label: "未同步至云文档数",
          valueOriginType: "calculate"
        },
        params: [
          { key: "user_add_error", label: "用户新增失败数", sign: "+" },
          { key: "user_uncreate", label: "用户未创建数", sign: "+" },
          { key: "drift_user", label: "游离用户", sign: "+" },
          { key: "drift_dept_user", label: "游离部门下用户", sign: "" },
        ],
        isShow: function (data: any) {
          return data?.total_user === data?.scope_user
        }
      },
      {
        tip: "",
        result: {
          key: "sync_user",
          label: "同步用户数",
          valueOriginType: "get"
        },
        params: [
          { key: "user_add", label: "新增用户数", sign: "+" },
          { key: "user_update", label: "更新用户数", sign: "+" },
          { key: "user_add_error", label: "用户新增失败数", sign: "+" },
          { key: "user_update_error", label: "用户更新失败数", sign: "+" },
          { key: "user_update_ignore", label: "无更新用户数", sign: "" },
        ]
      },
      {
        tip: "",
        result: {
          key: "scope_user",
          label: "同步范围用户数",
          valueOriginType: "get"
        },
        params: [
          { key: "sync_user", label: "同步用户数", sign: "+" },
          { key: "user_uncreate", label: "用户未创建数", sign: "+" },
          { key: "drift_user", label: "游离用户", sign: "+" },
          { key: "drift_dept_user", label: "游离部门下用户", sign: "" },
        ],
        isShow: function (data: any) {
          return data?.total_user === data?.scope_user
        }
      },
      {
        tip: "",
        result: {
          key: "scope_user",
          label: "同步范围用户数",
          valueOriginType: "get"
        },
        params: [
          { key: "sync_user", label: "同步用户数", sign: "+" },
          { key: "user_uncreate", label: "用户未创建数", sign: "" },
        ],
        isShow: function (data: any) {
          return data?.total_user !== data?.scope_user
        }
      }
    ]
  },
  [USER_DEPT_RELATION_SYNC_DATA]: {
    type: "card",
    analyseData: [
      { key: "total_dept_user", label: "总部门用户数", type: "number", tip: "采集表中总的部门用户关系数据" },
      { key: "scope_dept_user", label: "同步范围部门用户数", type: "number", tip: "同步时勾选的部门用户数" },
      // { key: "sync_dept_user", label: "同步部门用户数", type: "number", tip: "实际同步的部门用户数，新增部门用户数 + 部门用户新增失败数 + 用户排序或主部门更新数 + 用户排序或主部门更新失败数" },
      { key: "dept_user_add", label: "新增部门用户数", type: "number", tip: "同步过程中新增的部门用户数" },
      { key: "dept_user_add_error", label: "部门用户新增失败数", type: "number", tip: "由于错误导致的部门用户新增失败数" },
      { key: "dept_user_delete", label: "删除部门用户数", type: "number", tip: "同步过程中被删除的部门用户数" },
      { key: "dept_user_delete_error", label: "部门用户删除失败数", type: "number", tip: "由于错误导致的部门用户删除失败数" },
      { key: "user_sort_or_main_dept_update", label: "用户排序或主部门更新数", type: "number", tip: "同步过程中用户排序或主部门更新的数量" },
      { key: "user_sort_or_main_dept_update_error", label: "用户排序或主部门更新失败数", type: "number", tip: "由于错误导致的用户排序或主部门更新失败数" },
      { key: "dept_user_error", label: "部门用户错误数", type: "number", tip: "所有部门用户相关的错误总数，部门用户新增失败数 + 部门用户删除失败数 + 用户排序或主部门更新失败数" },
    ],
    formulaConfig: [
      {
        tip: "",
        result: {
          key: "dept_user_error",
          label: "部门用户错误数",
          valueOriginType: "get"
        },
        params: [
          { key: "dept_user_add_error", label: "部门用户新增失败数", sign: "+" },
          { key: "dept_user_delete_error", label: "部门用户删除失败数", sign: "+" },
          { key: "user_sort_or_main_dept_update_error", label: "用户排序或主部门更新失败数", sign: "" }
        ]
      }
    ]
  },
  [ERROR_REASON_DATA]: {
    type: "table",
    analyseData: [],
    formulaConfig: []
  }
}

export const syncTbTypeList = {
  user: "用户表",
  dept: "部门表",
  dept_user: "部门用户关系表",
}


export const syncOperateTypeList = {
  user_add: "用户同步",
  dept_add: "部门同步",
  dept_user_add: "部门用户同步",
}



export enum AnalyseStatusEnum {
  UNSTART = 10,
  ANALYSING = 50,
  ANALYSESUCCESS = 100,
  ANALYSEFAIL = -100,
  ANALYSESTOPSUCCESS = -50,
  ANALYSESTOPING = -60
}

export const analyseStatusMap = new Map([
  [AnalyseStatusEnum.UNSTART, "未开始"],
  [AnalyseStatusEnum.ANALYSING, "分析中"],
  [AnalyseStatusEnum.ANALYSESUCCESS, "分析成功"],
  [AnalyseStatusEnum.ANALYSEFAIL, "分析失败"],
  [AnalyseStatusEnum.ANALYSESTOPSUCCESS, "分析终止成功"],
  [AnalyseStatusEnum.ANALYSESTOPING, "分析终止中"],
])

export const updateTypeList = {
  dept: [
    { key: "dept_del", label: "删除部门" },
    { key: "dept_update", label: "修改部门" },
    { key: "dept_add", label: "添加部门" },
    { key: "dept_move", label: "移动部门" }
  ],
  user: [
    { key: "user_del", label: "删除用户" },
    { key: "user_add", label: "添加用户" },
    { key: "user_update", label: "修改用户" },
    { key: "user_enable", label: "启用用户" },
    { key: "user_disable", label: "禁用用户" }
  ],
  dept_user: [
    { key: "user_dept_add", label: "用户加入部门" },
    { key: "user_dept_del", label: "用户移除部门" },
    { key: "user_order_main_update", label: "用户主部门或部门排序修改" },
  ]
}

// 分表错误类型
export const errorTypeList = {
  user: [
    { key: "user_account_disabled", label: "账户被禁用" },
    { key: "user_param_format_error", label: "请求参数格式有误" },
    { key: "user_value_invalid_error", label: "请求参数取值无效" },
    { key: "user_param_unsupported", label: "请求参数不支持" },
    { key: "user_account_invalid", label: "企业成员账号无效" },
    { key: "user_nick_name_invalid", label: "企业成员昵称无效" },
    { key: "user_gender_invalid", label: "企业成员性别无效" },
    { key: "user_employee_id_invalid", label: "企业成员工号无效" },
    { key: "user_mobile_phone_invalid", label: "企业成员手机号无效" },
    { key: "user_email_invalid", label: "企业成员邮箱无效" },
    { key: "user_telephone_invalid", label: "企业成员电话无效" },
    { key: "user_title_invalid", label: "企业成员职务无效" },
    { key: "user_employment_type_invalid", label: "企业成员员工类型无效" },
    { key: "user_employment_status_invalid", label: "企业成员员工状态无效" },
    { key: "user_password_weak", label: "密码不符合要求" },
    { key: "user_exist_check_member_union_id", label: "存在相同成员三方标识正在使用" },
    { key: "user_union_id_already_exist", label: "成员三方标识已经存在" },
    { key: "user_field_name_alrteady_exist", label: "自定义字段名已存在" },
    { key: "user_custom_field_limit_exceeded", label: "用户自定义字段超出限制" },
    { key: "user_custom_field_value_limit_exceeded", label: "用户自定义字段值超出限制" },
    { key: "user_custom_field_value_exist_spechar", label: "自定义字段值存在特殊字符" },
    { key: "user_login_name_exists", label: "用户登录名已被占用" },
    { key: "user_avatar_invalid", label: "用户头像无效" },
    { key: "user_leader_invalid", label: "用户领导ID无效" },
    { key: "user_member_num_limit", label: "超出企业用户数限制" },
    { key: "user_title_name_already_exist", label: "职务名称已存在" },
    { key: "user_unknow_error", label: "其他" }
  ],
  dept: [
    { key: "dept_is_not_empty", label: "非空部门" },
    { key: "dept_root_dept_exists", label: "根部门已存在" },
    { key: "dept_name_invalid", label: "部门名称无效" },
    { key: "dept_alias_invalid", label: "部门显示名称无效" },
    { key: "dept_name_exists", label: "部门名称已存在" },
    { key: "dept_order_is_refactoring", label: "部门排序权重重构中" },
    { key: "dept_param_format_error", label: "请求参数格式有误" },
    { key: "dept_value_invalid_error", label: "请求参数取值无效" },
    { key: "dept_max_depth_limit", label: "请求参数不支持" },
    { key: "dept_exist_check_dept_union_id", label: "存在相同的部门三方标识正在使用" },
    { key: "dept_union_id_already_exist", label: "部门三方标识已经存在" },
    { key: "dept_unknow_error", label: "其他" }
  ],
  dept_user: [
    { key: "dept_user_order_is_refactoring", label: "部门成员排序权重重构中" },
    { key: "dept_user_account_dept_num_limit", label: "用户部门数超出限制" },
    { key: "dept_user_unknow_error", label: "其他" }
  ]
};


export const analyseStatusErrorMsg = {
  110: "已经有同步任务执行中，等待同步任务完成",
  120: "已经有其他分析任务执行中，等待其他分析任务完成",
  500: "未知错误无法进行分析",
  130: "全量同步任务不存在",
  140: "当前同步任务处于告警状态，请先进行处理",
  150: "当前同步任务未执行完成，请等待完成",
  160: "任务已取消，无需进行统计分析"
}

