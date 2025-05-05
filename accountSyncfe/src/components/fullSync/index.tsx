import { useContext, useEffect, useState } from "react";
import { ColumnsType } from "antd/lib/table";
import { RetrySettingModal } from "./modal";
import { Button, message, Modal, Select, Table, Tooltip } from "antd";
import { formatTime, camel, getEnumKeyByValue } from "@/utils";
import SyncAllDrawer from "./drawer";
import {
  AUTO_SYNC,
  FULL_SYNC_CANCEL,
  FULL_SYNC_ERROR,
  FULL_SYNC_RANGE_WARN,
  FULL_SYNC_SUCCESS,
  FULL_SYNC_THRESHOLD_WARN,
  FULL_SYNC_WAIT,
  FULL_SYNCING,
  fullStatusEnum,
  MANUAL_SYNC,
  PAGE_SIZE,
  ROLL_RETRY_SYNC,
  ROLLBACK_SYNC,
  syncTypeEnum,
} from "@/constants";
import "moment";
import { fullSyncApi } from "@/api/fullSync";
import { IFullSyncItem } from "@/types/fullSync";
import style from "./style.module.less";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
import { SettingContext } from "@/page";

export default function FullSync() {
  // 选中任务Id（详情/重试）
  const [taskId, setTaskId] = useState("");
  // 展示详情面板
  const [showDetail, setShowDetail] = useState(false);
  // 展示全量同步重试设置面板
  const [showSetting, setShowSetting] = useState(false);
  // 查询参数：任务状态
  const [status, setStatus] = useState<number[]>([]);
  // 查询参数：同步方式
  const [syncWay, setSyncWay] = useState<string[]>([]);
  // 数据列表
  const [data, setData] = useState<IFullSyncItem[]>([]);
  // 数据总量
  const [total, setTotal] = useState<number>(0);
  // 当前页码
  const [current, setCurrent] = useState<number>(1);

  const { setShowAnalyseBoard, setAnalyseTaskId } = useContext(SettingContext);

  useEffect(() => {
    getDataList();
  }, [current]);

  const showDetailDrawer = (record: IFullSyncItem) => {
    const { taskId } = record;
    setShowDetail(true);
    setTaskId(taskId);
  };

  const closeDrawer = () => setShowDetail(false);

  const closeSetting = () => setShowSetting(false);

  const showRetryModal = async (record: IFullSyncItem) => {
    const { taskId } = record;
    Modal.confirm({
      title: ZH_CN["full_sync_retry_modal_title"],
      content: `当前自动同步程序已暂停，您可选择任务ID：${taskId} 全量任务进行重试。重试成功后自动同步程序自动恢复；若任务重试失败，可选择再次重试或者手动开启自动同步程序同步最新数据`,
      cancelText: ZH_CN["full_sync_retry_modal_cancel"],
      cancelButtonProps: { type: "primary" },
      autoFocusButton: null,

      okText: ZH_CN["full_sync_retry_modal_ok"],
      okType: "default",
      onOk: () => {
        setTaskId(taskId);
        setShowSetting(true);
      },
      centered: true,
    });
  };

  const showStopModal = (record: IFullSyncItem) => {
    const { taskId } = record;
    Modal.confirm({
      title: ZH_CN["full_sync_stop_modal_title"],
      content: ZH_CN["full_sync_stop_modal_content"],
      cancelText: ZH_CN["full_sync_stop_modal_cancel"],
      cancelButtonProps: { type: "primary" },
      autoFocusButton: null,

      okText: ZH_CN["full_sync_stop_modal_ok"],
      okType: "default",
      onOk: () =>
        fullSyncApi.stopFullSync({ taskId }).then((res) => {
          if (res) {
            message.success(ZH_CN["full_sync_stop_success"]);
            getDataList();
          }
        }),
      centered: true,
    });
  };

  const showCancelModal = (record: IFullSyncItem) => {
    const { taskId } = record;
    Modal.confirm({
      title: ZH_CN["full_sync_cancel_modal_title"],
      content: ZH_CN["full_sync_cancel_modal_content"],
      cancelText: ZH_CN["full_sync_cancel_modal_cancel"],
      cancelButtonProps: { type: "primary" },
      autoFocusButton: null,
      okText: ZH_CN["full_sync_cancel_modal_ok"],
      okType: "default",
      onOk: () =>
        fullSyncApi.cancelFullSync({ taskId }).then((res) => {
          if (res) {
            message.success(ZH_CN["full_sync_cancel_success"]);
            getDataList();
          }
        }),
      centered: true,
    });
  };

  const showContinueModal = (record: IFullSyncItem) => {
    const { taskId } = record;
    Modal.confirm({
      title: ZH_CN["full_sync_continue_modal_title"],
      content: ZH_CN["full_sync_continue_modal_content"],
      cancelText: ZH_CN["full_sync_continue_modal_cancel"],
      autoFocusButton: null,
      okText: ZH_CN["full_sync_continue_modal_ok"],
      onOk: () =>
        fullSyncApi.continueFullSync({ task_id: taskId }).then((res) => {
          if (res) {
            message.success(ZH_CN["full_sync_continue_success"]);
            getDataList();
          }
        }),
      centered: true,
    });
  };

  const changeCurrent = (page: number) => setCurrent(page);

  const changeSyncWay = (value: string[]) => setSyncWay(value);

  const changStatus = (value: number[]) => setStatus(value);

  const handleSearch = () => {
    if (current === 1) getDataList();
    else setCurrent(1);
  };

  const getDataList = () => {
    fullSyncApi
      .getFullSyncList({
        syncWay: syncWay.includes(MANUAL_SYNC) ? [...syncWay, ROLL_RETRY_SYNC] : syncWay,
        status: status.includes(FULL_SYNC_THRESHOLD_WARN) ? [...status, FULL_SYNC_RANGE_WARN] : status,
        offset: current - 1,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        setData(camel(res?.data?.taskData));
        setTotal(res?.data?.total);
      });
  };

  // 打开分析面板
  const openAnalyse = (record: IFullSyncItem) => {
    setAnalyseTaskId(record.taskId);
    setShowAnalyseBoard(true);
  };

  const columns: ColumnsType<IFullSyncItem> = [
    {
      title: ZH_CN["full_sync_task_id"],
      dataIndex: "taskId",
      ellipsis: true,
    },
    {
      title: ZH_CN["full_sync_way"],
      ellipsis: true,
      dataIndex: "syncType",
      render: (_, r) =>
        r.syncType === ROLL_RETRY_SYNC
          ? getEnumKeyByValue(syncTypeEnum, AUTO_SYNC)
          : getEnumKeyByValue(syncTypeEnum, r.syncType),
    },
    {
      title: ZH_CN["full_sync_status"],
      ellipsis: true,
      dataIndex: "status",
      render: (_, r) => (
        // 警告、异常样式
        <div
          style={{
            color:
              r.status === FULL_SYNC_ERROR
                ? "#EA0000"
                : r.status === FULL_SYNC_THRESHOLD_WARN || r.status === FULL_SYNC_RANGE_WARN
                  ? "#F72F04"
                  : "#000",
          }}
        >
          {r.status === FULL_SYNC_RANGE_WARN ? fullStatusEnum[FULL_SYNC_THRESHOLD_WARN] : fullStatusEnum[r.status]}
        </div>
      ),
    },
    {
      title: ZH_CN["full_sync_cost_time"],
      dataIndex: "collectCost",
      render: (_, { status, collectCost, endTime, beginTime }) => {
        const showCollect = status !== FULL_SYNC_WAIT;
        const showSync = status === FULL_SYNC_ERROR || status === FULL_SYNC_SUCCESS;
        const syncTime = new Date(endTime).valueOf() - new Date(beginTime).valueOf();
        return (
          <div>
            {ZH_CN["full_sync_sync_time"]}： {showSync ? formatTime(syncTime / 1000) : "--"}
            <br />
            {ZH_CN["full_sync_collect_time"]}： {showCollect ? formatTime(collectCost) : "--"}
          </div>
        );
      },
    },
    {
      title: ZH_CN["full_sync_data"],
      ellipsis: true,
      key: "number",
      render: (_, { status, totalSuccess, totalError }) => {
        const showSync = status === FULL_SYNC_SUCCESS || status === FULL_SYNC_ERROR;
        return showSync ? (
          <div>
            {totalSuccess || 0}/<span style={{ color: "#EA0000" }}>{totalError || 0}</span>
          </div>
        ) : (
          "--"
        );
      },
    },
    {
      title: ZH_CN["full_sync_start_time"],
      ellipsis: true,
      dataIndex: "beginTime",
      render: (beginTime) => (beginTime ? new Date(beginTime).toLocaleString() : "-"),
    },
    {
      title: ZH_CN["full_sync_operator"],
      ellipsis: true,
      dataIndex: "operator",
    },
    {
      title: ZH_CN["full_sync_action"],
      key: "action",
      render: (_, r) => (
        <div>
          <a onClick={() => showDetailDrawer(r)}>{ZH_CN["sync_get_detail"]}</a>
          {r.status !== FULL_SYNC_CANCEL && r.status !== FULL_SYNC_SUCCESS && <a> | </a>}
          {r.status === FULL_SYNC_ERROR && (
            <>
              {r.isRetry ? (
                <a onClick={() => showRetryModal(r)}>{ZH_CN["sync_retry"]}</a>
              ) : (
                <Tooltip title={ZH_CN["full_sync_retry_modal_cannot_retry"]}>
                  <a style={{ color: "#767676", cursor: "not-allowed" }}>{ZH_CN["sync_retry"]}</a>
                </Tooltip>
              )}
            </>
          )}
          {(r.status === FULL_SYNC_RANGE_WARN || r.status === FULL_SYNC_THRESHOLD_WARN) && (
            <>
              {r.isContinueSync ? (
                <a onClick={() => showContinueModal(r)}>{ZH_CN["sync_continue"]}</a>
              ) : (
                <Tooltip title={ZH_CN["full_sync_continue_modal_cannot_continue"]}>
                  <a style={{ color: "#767676", cursor: "not-allowed" }}>{ZH_CN["sync_continue"]}</a>
                </Tooltip>
              )}
            </>
          )}
          {r.status === FULL_SYNC_WAIT && <a onClick={() => showCancelModal(r)}>{ZH_CN["sync_cancel_sync"]}</a>}
          {r.status === FULL_SYNCING && <a onClick={() => showStopModal(r)}>{ZH_CN["sync_stop"]}</a>}
          <a> | </a>
          {r.status === FULL_SYNC_CANCEL ?
            <Tooltip title="当前任务已取消，无需进行分析">
              <a style={{ color: "#767676", cursor: "not-allowed" }}>{ZH_CN["sync_analyse_detail"]}</a>
            </Tooltip> : <a onClick={() => openAnalyse(r)}>{ZH_CN["sync_analyse_detail"]}</a>}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className={style["sync-search"]}>
        <div className={style["search-item"]}>
          <div className={style["title"]}>{ZH_CN["full_sync_way"]}</div>
          <Select
            defaultValue={syncWay}
            style={{ minWidth: 140 }}
            showSearch={false}
            onChange={changeSyncWay}
            mode="multiple"
            placeholder={ZH_CN["please_select"] + ZH_CN["full_sync_way"]}
            options={[
              { value: AUTO_SYNC, label: getEnumKeyByValue(syncTypeEnum, AUTO_SYNC) },
              { value: MANUAL_SYNC, label: getEnumKeyByValue(syncTypeEnum, MANUAL_SYNC) },
              { value: ROLLBACK_SYNC, label: getEnumKeyByValue(syncTypeEnum, ROLLBACK_SYNC) },
            ]}
          />
        </div>

        <div className={style["search-item"]}>
          <div className={style["title"]}>{ZH_CN["full_sync_status"]}</div>
          <Select
            defaultValue={status}
            style={{ minWidth: 140 }}
            mode="multiple"
            showSearch={false}
            onChange={changStatus}
            placeholder={ZH_CN["please_select"] + ZH_CN["full_sync_status"]}
            options={[
              { value: FULL_SYNC_WAIT, label: fullStatusEnum[FULL_SYNC_WAIT] },
              { value: FULL_SYNCING, label: fullStatusEnum[FULL_SYNCING] },
              { value: FULL_SYNC_SUCCESS, label: fullStatusEnum[FULL_SYNC_SUCCESS] },
              { value: FULL_SYNC_ERROR, label: fullStatusEnum[FULL_SYNC_ERROR] },
              { value: FULL_SYNC_CANCEL, label: fullStatusEnum[FULL_SYNC_CANCEL] },
              { value: FULL_SYNC_THRESHOLD_WARN, label: fullStatusEnum[FULL_SYNC_THRESHOLD_WARN] },
            ]}
          />
        </div>
        <div className={style["search-item"]}>
          <Button type="primary" onClick={handleSearch}>
            {ZH_CN["sync_search"]}
          </Button>
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
      </div>
      <SyncAllDrawer taskId={taskId} visible={showDetail} onClose={closeDrawer} refresh={getDataList} />
      <RetrySettingModal refresh={getDataList} taskId={taskId} visible={showSetting} onClose={closeSetting} />
    </>
  );
}
