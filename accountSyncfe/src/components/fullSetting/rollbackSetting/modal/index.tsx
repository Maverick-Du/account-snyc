import { Button, DatePicker, Input, Modal, Table } from "antd";
import { useState } from "react";
import moment, { Moment } from "moment";
import style from "./style.module.less";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
import { ConfirmModal } from "./confirm";
import { ColumnsType } from "antd/lib/table";
import { camel, debounce } from "@/utils";
import { PAGE_SIZE } from "@/constants";
import { IFullSyncDetail } from "@/types/fullSync";
import { fullSyncApi } from "@/api/fullSync";

interface IProps {
  visible: boolean;
  onClose: () => void;
  refresh: () => void;
}
const { RangePicker } = DatePicker;

export function RollbackModal(props: IProps) {
  const { visible, onClose, refresh } = props;
  // 二次确认弹窗
  const [confirmVisible, setConfirmVisible] = useState(false);
  // 回滚任务列表
  const [taskList, setTaskList] = useState<IFullSyncDetail[]>([]);
  const [chooseTaskId, setChooseTaskId] = useState<string>("");
  // 查询参数：同步内容
  const [content, setContent] = useState<string>("");
  // 查询参数：同步时间
  const [scheduleTime, setScheduleTime] = useState<number[]>([]);
  // 查询偏移量
  const [offset, setOffset] = useState(0);
  // 是否继续查询
  const [continueSearch, setContinueSearch] = useState(true);

  const handleScroll = debounce(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { scrollHeight, offsetHeight, scrollTop } = e.target;
    if (scrollHeight - offsetHeight - scrollTop < 10 && continueSearch) {
      const res = await fullSyncApi.getFullSyncTaskSuccess({
        content,
        scheduleTime:
          scheduleTime && scheduleTime.length !== 0
            ? { startTime: scheduleTime[0], endTime: scheduleTime[1] }
            : undefined,
        offset: offset + 1,
        limit: PAGE_SIZE,
      });
      const reqTaskList = camel(res?.data?.taskList) || [];
      setTaskList([...taskList, ...reqTaskList]);
      setOffset(offset + 1);
      if (reqTaskList.length < PAGE_SIZE) setContinueSearch(false);
      else setContinueSearch(true);
    }
  }, 200);

  const columns: ColumnsType<IFullSyncDetail> = [
    {
      title: ZH_CN["full_sync_task_id"],
      dataIndex: "taskId",
      ellipsis: true,
    },
    {
      title: ZH_CN["full_sync_data"],
      ellipsis: true,
      render: (_, r) => (
        <div>
          {r.totalSuccess || 0}/<span style={{ color: "#EA0000" }}>{r.totalError || 0}</span>{" "}
        </div>
      ),
    },
    {
      title: ZH_CN["full_sync_start_time"],
      dataIndex: "beginTime",
      ellipsis: true,
      render: (beginTime) => (beginTime ? new Date(beginTime).toLocaleString() : "-"),
    },
  ];

  const showConfirm = () => {
    if (chooseTaskId) setConfirmVisible(true);
  };

  const closeConfirm = () => setConfirmVisible(false);

  const chooseTask = async (selectedRowKeys: React.Key[]) => setChooseTaskId(selectedRowKeys[0] as string);

  const changeContent = (e: React.ChangeEvent<HTMLInputElement>) => setContent(e.target.value?.trim());

  const changeScheduleTime = (values: [Moment | null, Moment | null] | null) => {
    const startTime = values?.[0]?.valueOf();
    const startDate = new Date(startTime || Date.now());
    startDate.setHours(0, 0, 0, 0);
    const endTime = values?.[1]?.valueOf();
    const endDate = new Date(endTime || Date.now());
    endDate.setHours(23, 59, 59, 999);
    setScheduleTime([startDate.getTime(), endDate.getTime()]);
  };

  // 只能选择三个月以内数据
  const disabledDate = (current: Moment) =>
    current && (current > moment().endOf("day") || current < moment().subtract(90, "days"));

  const handleSearch = async () => {
    if ((scheduleTime && scheduleTime.length !== 0) || content) {
      const res = await fullSyncApi.getFullSyncTaskSuccess({
        offset: 0,
        limit: PAGE_SIZE,
        content,
        scheduleTime:
          scheduleTime && scheduleTime.length !== 0
            ? { startTime: scheduleTime[0], endTime: scheduleTime[1] }
            : undefined,
      });
      const reqTaskList = camel(res?.data?.taskList) || [];
      setTaskList(reqTaskList);
      setOffset(0);
      setChooseTaskId("");
      if (reqTaskList.length < PAGE_SIZE) setContinueSearch(false);
      else setContinueSearch(true);
    } else {
      // 重置
      setTaskList([]);
      setOffset(0);
      setContinueSearch(false);
      setChooseTaskId("");
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        title={ZH_CN["full_sync_setting_rollback_create"]}
        onCancel={onClose}
        width={1003}
        destroyOnClose
        centered
        footer={[
          <Button key="submit" type="primary" onClick={showConfirm}>
            {ZH_CN["sync_confirm"]}
          </Button>,
          <Button key="back" onClick={onClose}>
            {ZH_CN["sync_cancel"]}
          </Button>,
        ]}
      >
        <div className={style["create_task_modal_search"]}>
          {ZH_CN["full_sync_start_time"]}

          <RangePicker onChange={changeScheduleTime} className={style["date"]} disabledDate={disabledDate} />
          {ZH_CN["full_sync_task_id"]}
          <Input
            className={style["input"]}
            onChange={changeContent}
            allowClear
            placeholder={ZH_CN["full_sync_setting_rollback_create_input_placeholder"]}
          />
          <Button key="submit" type="primary" className={style["btn"]} onClick={handleSearch}>
            {ZH_CN["sync_confirm"]}
          </Button>
        </div>
        <div className={style["create_task_modal_tips"]}>{ZH_CN["full_sync_setting_rollback_create_tips"]}</div>
        <div className={style["create_task_modal_table"]} onScroll={handleScroll}>
          <Table
            columns={columns}
            dataSource={taskList}
            rowKey="taskId"
            rowSelection={{ type: "radio", onChange: chooseTask }}
            locale={{ emptyText: ZH_CN["no_data"] }}
            pagination={false}
          />
        </div>
      </Modal>
      <ConfirmModal
        taskId={chooseTaskId}
        visible={confirmVisible}
        closeConfirm={closeConfirm}
        onClose={onClose}
        refresh={refresh}
      />
    </>
  );
}
