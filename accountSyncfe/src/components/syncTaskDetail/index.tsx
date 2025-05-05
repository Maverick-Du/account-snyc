import { analyseApi } from "@/api/analyse";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
import { PAGE_SIZE, TIncrementSyncUpdateType, updateTypeEnum } from "@/constants";
import { errorTypeList, updateTypeList } from "@/constants/analyse";
import { Button, Input, message, Select, Table } from "antd";
import { useEffect, useState } from "react";

interface Props {
  analyseTaskId: string;
  initErrorSearch: Record<string, string> | null;
}

export default function SyncTaskDetail(props: Props) {

  // 分析数据
  const [data, setData] = useState([]);
  // 每页数量
  const [pageSize] = useState(PAGE_SIZE);
  // 当前页
  const [current, setCurrent] = useState(1);
  // 总数
  const [total, setTotal] = useState(0);
  // 同步类型
  const [syncTbType, setSyncTbType] = useState("dept");
  // 操作类型
  const [updateType, setUpdateType] = useState("");
  // 错误类型
  const [errorType, setErrorType] = useState("");
  // 用户部门
  const [userDeptContent, setUserDeptContent] = useState("");
  // 列表表头切换类型
  const [columnsType, setColumnsType] = useState("dept");

  const changeCurrent = (page: number) => setCurrent(page);

  // 获取错误数据详情
  const getErrorDetailData = async (offset: number, limit: number, sync_tb_type: string, update_type?: string, err_type?: string, content?: string) => {
    try {
      const res = await analyseApi.getErrorDataDetail({
        task_id: props.analyseTaskId,
        offset,
        limit,
        sync_tb_type,
        update_type,
        err_type,
        content
      });
      setData(res?.data?.rows);
      setTotal(res?.data?.total);
    } catch (error) {
      message.error("查询错误数据详情失败\n" + error);
    }
  }

  // 手动查询详情
  const queryErrorDetailData = () => {
    setColumnsType(syncTbType)
    if (current === 1) {
      getErrorDetailData(current - 1, pageSize, syncTbType, updateType, errorType, userDeptContent);
    } else {
      setCurrent(1);
    }
  }

  // 重置查询条件
  const resetCondition = () => {
    setSyncTbType("dept");
    setColumnsType("dept");
    setUpdateType("");
    setErrorType("");
    setUserDeptContent("");
    getErrorDetailData(current - 1, pageSize, "dept", "", "", "");
  };

  // 输入用户部门
  const changeContent = (e: React.ChangeEvent<HTMLInputElement>) => setUserDeptContent(e.target.value);

  useEffect(() => {
    if (props.initErrorSearch) {
      setColumnsType(props.initErrorSearch.syncTbType);
      setSyncTbType(props.initErrorSearch.syncTbType);
      setUpdateType(props.initErrorSearch.updateType);
      setErrorType(props.initErrorSearch.errorType);
      getErrorDetailData(current - 1, pageSize, props.initErrorSearch.syncTbType, props.initErrorSearch.updateType, props.initErrorSearch.errorType, userDeptContent);
      // 带有初始化的查询
    } else {
      getErrorDetailData(current - 1, pageSize, syncTbType, updateType, errorType, userDeptContent);
    }
  }, [current]);

  // 用户同步columns表
  const userColumns = [
    {
      title: ZH_CN["user_account"],
      dataIndex: "account",
      ellipsis: true,
    },
    {
      title: ZH_CN["nick_name"],
      dataIndex: "name",
      ellipsis: true,
    },
    {
      title: ZH_CN["client_user_unique_id"],
      dataIndex: "uid",
      ellipsis: true,
    },
    {
      title: ZH_CN["yundoc_dept_id"],
      dataIndex: "wps_did",
      ellipsis: true,
    },
    {
      title: ZH_CN["dept_path"],
      dataIndex: "abs_path",
      ellipsis: true,
    }
  ];

  // 部门同步columns表
  const deptColumns = [
    { title: ZH_CN["dept_name"], dataIndex: "name", ellipsis: true },
    { title: ZH_CN["client_dept_unique_id"], dataIndex: "did", ellipsis: true },
    { title: ZH_CN["yundoc_parent_dept_id"], dataIndex: "wps_pid", ellipsis: true },
    { title: ZH_CN["dept_path"], dataIndex: "abs_path", ellipsis: true }
  ]

  // 部门用户关系同步columns表
  const deptUserColumns = [
    { title: ZH_CN["user_account"], dataIndex: "account", ellipsis: true },
    { title: ZH_CN["nick_name"], dataIndex: "name", ellipsis: true },
    { title: ZH_CN["client_user_unique_id"], dataIndex: "uid", ellipsis: true },
    { title: ZH_CN["yundoc_dept_unique_id"], dataIndex: "wps_did", ellipsis: true },
    { title: ZH_CN["dept_path"], dataIndex: "abs_path", ellipsis: true }
  ]

  const commonColumns = [
    {
      title: ZH_CN["update_type"],
      dataIndex: "update_type",
      ellipsis: true,
      render: (text: TIncrementSyncUpdateType) => updateTypeEnum?.[text] || "--"
    },
    {
      title: ZH_CN["error_reason"],
      dataIndex: "msg",
      ellipsis: true,
      render: (msg: string) => msg || "--"
    },
    {
      title: ZH_CN["error_type"],
      dataIndex: "err_type",
      ellipsis: true,
      render: (err_type: string) => {
        let wholeErrorTypeList: Array<Record<string, any>> = [];
        Object.keys(errorTypeList).forEach((key: string) => {
          wholeErrorTypeList = wholeErrorTypeList.concat(errorTypeList[key as keyof typeof errorTypeList]);
        });

        const errorTypeItem = wholeErrorTypeList.find((item) => item.key === err_type);
        return <span>{errorTypeItem?.label || "--"}</span>
      }
    },
    {
      title: ZH_CN["platform_id"],
      dataIndex: "platform_id",
      ellipsis: true,
    }
  ];

  const getColumns = () => {
    switch (columnsType) {
      case "user":
        return commonColumns.concat(userColumns);
      case "dept":
        return commonColumns.concat(deptColumns);
      case "dept_user":
        return commonColumns.concat(deptUserColumns);
      default:
        return commonColumns;
    }
  }

  return (
    <div style={{ margin: '0px 20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <span>{ZH_CN["sync_type"]}: </span>
        <Select style={{ width: "150px", marginRight: "10px" }} size='small' value={syncTbType} onChange={(value: string) => {
          setUpdateType("");
          setErrorType("");
          setUserDeptContent("");
          setSyncTbType(value)
        }}>
          <Select.Option value="dept">{ZH_CN["dept_table"]}</Select.Option>
          <Select.Option value="user">{ZH_CN["user_table"]}</Select.Option>
          <Select.Option value="dept_user">{ZH_CN["dept_user_relation_table"]}</Select.Option>
        </Select>
        <span>{ZH_CN["update_type"]}：</span>
        <Select style={{ width: "150px", marginRight: "10px" }} size='small' value={updateType} onChange={(value: string) => setUpdateType(value)}>
          <Select.Option value="">{ZH_CN["all"]}</Select.Option>
          {updateTypeList[syncTbType as keyof typeof updateTypeList].map((item) => {
            return <Select.Option key={item.key} value={item.key}>{item.label}</Select.Option>
          })}
        </Select>
        <span>{ZH_CN["error_type"]}：</span>
        <Select style={{ width: "200px", marginRight: "10px" }} size='small' value={errorType} onChange={(value: string) => setErrorType(value)}>
          <Select.Option value="">{ZH_CN["all"]}</Select.Option>
          {errorTypeList[syncTbType as keyof typeof errorTypeList].map((item) => {
            return <Select.Option key={item.key} value={item.key}>{item.label}</Select.Option>
          })}
        </Select>
        <span>{ZH_CN["user_dept"]}：</span>
        <Input style={{ width: "150px", marginRight: "10px" }} size="small" placeholder={syncTbType === "dept" ? "请输入部门名称" : "请输入用户名称"} value={userDeptContent} onChange={changeContent} />
        <Button size="small" style={{ marginRight: '10px' }} type="primary" onClick={queryErrorDetailData}>{ZH_CN["sync_search"]}</Button>
        <Button size="small" type="primary" onClick={resetCondition}>{ZH_CN["reset"]}</Button>
      </div>
      <Table
        columns={getColumns()}
        dataSource={data}
        pagination={{
          showQuickJumper: true,
          showTotal: (total: number) => `共${total}条`,
          pageSize: pageSize,
          onChange: changeCurrent,
          current,
          total,
          showSizeChanger: false,
        }}
        rowKey="id"
        locale={{ emptyText: ZH_CN["no_data"] }}
      />
    </div>
  )
}