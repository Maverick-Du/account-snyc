import { useEffect, useState } from "react";
import { ColumnsType } from "antd/lib/table";
import { Table, Button, DatePicker, Input, Modal, Select, message } from "antd";
import {
  TIncrementSyncType,
  INCREMENT_SYNC_ERROR,
  INCREMENT_SYNC_SUCCESS,
  typeEnum,
  syncTypeEnum,
  updateTypeEnum,
  incrementStatusEnum,
  AUTO_SYNC,
  MANUAL_SYNC,
  PAGE_SIZE,
  TYPE_USER,
  TYPE_DEPT,
  TYPE_USER_DEPT,
} from "@/constants";
import { Moment } from "moment";
import { incrementSyncApi } from "@/api/incrementSync";
import { camel, getEnumKeyByValue } from "@/utils";
import SyncIncreasedDrawer from "./drawer";
import { IIncrementSyncItem } from "@/types/incrementSync";
import style from "./style.module.less";
import ZH_CN from "@/assets/i18n/locales/zh-CN";

const { RangePicker } = DatePicker;

export default function SyncIncreasedTable() {
  // 展示增量同步详情面板
  const [detailVisible, setDetailVisible] = useState(false);
  // 详情面板任务Id
  const [id, setId] = useState<number>(0);
  // 详情面板任务类型
  const [type, setType] = useState<TIncrementSyncType>(TYPE_USER);
  // 查询参数：任务类型
  const [searchType, setSearchType] = useState<TIncrementSyncType>();
  // 查询参数：同步结果
  const [status, setStatus] = useState<number[]>([]);
  // 查询参数：同步时间
  const [scheduleTime, setScheduleTime] = useState<(number | undefined)[]>([]);
  // 查询参数：同步内容
  const [content, setContent] = useState<string>("");
  // 查询参数：同步方式
  const [syncWay, setSyncWay] = useState<string[]>([]);
  // 当前页码
  const [current, setCurrent] = useState<number>(1);
  // 数据总量
  const [total, setTotal] = useState<number>(0);
  // 数据列表
  const [data, setData] = useState<IIncrementSyncItem[]>([]);
  // 日期选择器选择范围
  const [dates, setDates] = useState<any>(null);

  useEffect(() => {
    getDataList();
  }, [current]);

  const changeContent = (e: React.ChangeEvent<HTMLInputElement>) => setContent(e.target.value?.trim());

  const changeCurrent = (page: number) => setCurrent(page);

  const changeType = (value: TIncrementSyncType) => {
    setType(value);
    if (value === TYPE_USER_DEPT) setContent("");
  };

  const changeStatus = (value: number[]) => setStatus(value);

  const changeScheduleTime = (values: [Moment | null, Moment | null] | null) =>
    setScheduleTime(values?.map((v: any) => v.valueOf()) || []);

  const changeSyncWay = (value: string[]) => setSyncWay(value);

  const closeDetailDrawer = () => setDetailVisible(false);

  const showDetail = (record: IIncrementSyncItem) => {
    const { id, type } = record;
    setDetailVisible(true);
    setId(id);
    setSearchType(type);
  };

  const disabledDate = (current: Moment) => {
    if (!dates) {
      return false;
    }
    const tooLate = dates[0] && current.diff(dates[0], "days") > 2;
    const tooEarly = dates[1] && dates[1].diff(current, "days") > 2;
    return !!tooEarly || !!tooLate;
  };

  const showRetryModal = (record: IIncrementSyncItem) => {
    const { id, type, mtime, content, updateType } = record;
    Modal.confirm({
      title: ZH_CN["increment_sync_retry_modal_title"],
      content: `是否要选择“ ${new Date(mtime).toLocaleString()} ${content} ${
        updateTypeEnum[updateType]
      }”异常节点重试？`,
      cancelText: ZH_CN["increment_sync_retry_modal_cancel"],
      cancelButtonProps: { type: "primary" },
      autoFocusButton: null,

      okText: ZH_CN["increment_sync_retry_modal_ok"],
      okType: "default",
      onOk: () =>
        incrementSyncApi.retryIncrementSync({ id, type }).then((res) => {
          if (res) {
            message.success(ZH_CN["increment_sync_retry_success"]);
            getDataList();
          }
        }),
      centered: true,
    });
  };

  const handleSearch = () => {
    if (current === 1) getDataList();
    else setCurrent(1);
  };

  // 获取增量同步列表
  const getDataList = () => {
    if (scheduleTime && scheduleTime.length !== 0) {
      if (Number(scheduleTime[1]) - Number(scheduleTime[0]) > 1000 * 60 * 60 * 24 * 3)
        return message.warn("时间范围不能超过3天");
      else if (Number(scheduleTime[1]) - Number(scheduleTime[0]) === 0) return message.warn("起止时间不能相同");
    }
    incrementSyncApi
      .getIncrementSyncList({
        syncWay,
        status,
        scheduleTime:
          scheduleTime && scheduleTime.length !== 0
            ? { startTime: scheduleTime[0], endTime: scheduleTime[1] }
            : undefined,
        content,
        type: type,
        offset: current - 1,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        const taskData = camel(res?.data?.taskData);
        taskData?.forEach((item: IIncrementSyncItem) => {
          const { updateType, uid, did } = item;
          item.type = updateType.includes("dept")
            ? updateType.includes("user")
              ? TYPE_USER_DEPT
              : TYPE_DEPT
            : TYPE_USER;
          item.content =
            item.type === "user_dept"
              ? `${ZH_CN["full_sync_dept"]}：${did} -> ${ZH_CN["full_sync_user"]}：${uid}`
              : item.nickName || item.deptName || "";
        });
        setData(taskData);
        setTotal(res?.data?.total);
      });
  };

  const columns: ColumnsType<IIncrementSyncItem> = [
    {
      title: ZH_CN["increment_sync_time"],
      dataIndex: "mtime",
      ellipsis: true,
      render: (mtime) => new Date(mtime).toLocaleString(),
    },
    {
      title: ZH_CN["increment_sync_content"],
      ellipsis: true,
      dataIndex: "content",
    },
    {
      title: ZH_CN["increment_sync_type"],
      ellipsis: true,
      dataIndex: "type",
      render: (_, r) => getEnumKeyByValue(typeEnum, r.type),
    },
    {
      title: ZH_CN["increment_sync_way"],
      ellipsis: true,
      dataIndex: "syncType",
      render: (_, r) => getEnumKeyByValue(syncTypeEnum, r.syncType),
    },
    {
      title: ZH_CN["increment_sync_operation"],
      ellipsis: true,
      dataIndex: "updateType",
      render: (_, r) => updateTypeEnum[r.updateType],
    },
    {
      title: ZH_CN["increment_sync_result"],
      ellipsis: true,
      dataIndex: "status",
      render: (_, r) => (
        <div style={{ color: r.status === INCREMENT_SYNC_ERROR ? "#EA0000" : "#000" }}>
          {incrementStatusEnum[r.status]}
        </div>
      ),
    },
    {
      title: ZH_CN["increment_sync_operator"],
      ellipsis: true,
      dataIndex: "operator",
    },
    {
      title: ZH_CN["increment_sync_action"],
      key: "action",
      render: (_, r) => (
        <div>
          <a onClick={() => showDetail(r)}>{ZH_CN["sync_get_detail"]}</a>
          {r.status === INCREMENT_SYNC_ERROR && (
            <>
              <a> | </a>
              <a onClick={() => showRetryModal(r)}>{ZH_CN["sync_retry"]}</a>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className={style["sync-setting"]}>
        <div className={style["sync-search"]}>
          <div className={style["search-item"]}>
            <div className={style["title"]}>{ZH_CN["increment_sync_user_dept"]}</div>
            <Input
              style={{ width: 180 }}
              placeholder={ZH_CN["increment_sync_search_input"]}
              onChange={changeContent}
              value={content}
              disabled={type === TYPE_USER_DEPT}
            />
          </div>
          <div className={style["search-item"]}>
            <div className={style["title"]}>{ZH_CN["increment_sync_type"]}</div>
            <Select
              style={{ width: 100 }}
              onChange={changeType}
              value={type}
              options={[
                { value: TYPE_USER, label: getEnumKeyByValue(typeEnum, TYPE_USER) },
                { value: TYPE_DEPT, label: getEnumKeyByValue(typeEnum, TYPE_DEPT) },
                { value: TYPE_USER_DEPT, label: getEnumKeyByValue(typeEnum, TYPE_USER_DEPT) },
              ]}
            />
          </div>
          <div className={style["search-item"]}>
            <div className={style["title"]}>{ZH_CN["increment_sync_way"]}</div>
            <Select
              mode="multiple"
              style={{ minWidth: 140 }}
              onChange={changeSyncWay}
              placeholder={ZH_CN["please_select"] + ZH_CN["increment_sync_way"]}
              options={[
                { value: AUTO_SYNC, label: getEnumKeyByValue(syncTypeEnum, AUTO_SYNC) },
                { value: MANUAL_SYNC, label: getEnumKeyByValue(syncTypeEnum, MANUAL_SYNC) },
              ]}
            />
          </div>
          <div className={style["search-item"]}>
            <div className={style["title"]}>{ZH_CN["increment_sync_result"]}</div>
            <Select
              mode="multiple"
              style={{ minWidth: 140 }}
              onChange={changeStatus}
              placeholder={ZH_CN["please_select"] + ZH_CN["increment_sync_result"]}
              options={[
                { value: INCREMENT_SYNC_ERROR, label: incrementStatusEnum[INCREMENT_SYNC_ERROR] },
                { value: INCREMENT_SYNC_SUCCESS, label: incrementStatusEnum[INCREMENT_SYNC_SUCCESS] },
              ]}
            />
          </div>
          <div className={style["search-item"]}>
            <div className={style["title"]}>{ZH_CN["increment_sync_time"]}</div>
            <RangePicker
              showTime={{ format: "HH:mm" }}
              onChange={changeScheduleTime}
              disabledDate={disabledDate}
              onCalendarChange={(val) => setDates(val)}
            />
          </div>
          <div className={style["search-item"]}>
            <Button type="primary" onClick={handleSearch}>
              {ZH_CN["sync_search"]}
            </Button>
          </div>
        </div>
      </div>
      <div className={style["sync-table"]}>
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            showQuickJumper: true,
            showTotal: (total: number) => `共${total}条`,
            pageSize: PAGE_SIZE,
            onChange: changeCurrent,
            current,
            total,
            showSizeChanger: false,
          }}
          rowKey="id"
          locale={{ emptyText: ZH_CN["no_data"] }}
        />
        <SyncIncreasedDrawer visible={detailVisible} id={id} onClose={closeDetailDrawer} type={searchType} />
      </div>
    </>
  );
}
