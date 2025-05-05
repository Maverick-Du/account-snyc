import { useEffect, useState } from "react";
import ZH_CN from "../../../assets/i18n/locales/zh-CN";
import style from "../style.module.less";
import { Table, Button } from "antd";
import { ColumnsType } from "antd/lib/table";
import { PAGE_SIZE } from "@/constants";
import { RollbackModal } from "./modal";
import { IRollbackList } from "@/types/rollback";
import { rollbackApi } from "@/api/rollback";
import { camel } from "@/utils";

export default function RollbackSetting() {
  // 回滚列表
  const [rollbackList, setRollbackList] = useState<IRollbackList[]>([]);
  // 数据总量
  const [total, setTotal] = useState<number>(0);
  // 当前页码
  const [current, setCurrent] = useState<number>(1);
  // 弹窗是否显示
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getRollbackList();
  }, [current]);

  const columns: ColumnsType<IRollbackList> = [
    {
      title: ZH_CN["full_sync_setting_rollback_list_id"],
      dataIndex: "taskId",
      ellipsis: true,
    },
    {
      title: ZH_CN["full_sync_setting_rollback_list_data"],
      ellipsis: true,
      render: (_, r) =>
        `${ZH_CN["full_sync_dept"]}：${r.totalDept || 0}；${ZH_CN["full_sync_user"]}：${r.totalUser || 0}；${
          ZH_CN["full_sync_dept_user"]
        }：${r.totalDeptUser || 0}`,
    },
    {
      title: ZH_CN["full_sync_setting_rollback_list_creator"],
      dataIndex: "operator",
      ellipsis: true,
    },
    {
      title: ZH_CN["full_sync_setting_rollback_list_time"],
      ellipsis: true,
      dataIndex: "beginTime",
      render: (time) => (time ? new Date(time).toLocaleString() : "-"),
    },
  ];

  const showRollbackModal = () => setVisible(true);

  const hideRollbackModal = () => setVisible(false);

  const getRollbackList = () => {
    rollbackApi.getRollbackList({ offset: current - 1, limit: PAGE_SIZE }).then((res) => {
      setRollbackList(camel(res?.data?.taskList));
      setTotal(res?.data?.total);
    });
  };

  const changeCurrent = (page: number) => setCurrent(page);

  return (
    <>
      <div className={style["setting-title"]}>
        {ZH_CN["full_sync_setting_rollback"]}
        {ZH_CN["sync_setting"]}
      </div>
      <div className={style["setting-tip"]}>{ZH_CN["full_sync_setting_rollback_tips"]}</div>

      <div className={style["setting-item"]}>
        <Button onClick={showRollbackModal}>{ZH_CN["full_sync_setting_rollback_create"]}</Button>
      </div>

      <div className={style["setting-rollback-table"]}>
        <Table
          columns={columns}
          dataSource={rollbackList}
          pagination={{
            showQuickJumper: true,
            showTotal: (total: number) => `共${total}条`,
            pageSize: PAGE_SIZE,
            onChange: changeCurrent,
            current,
            total,
            showSizeChanger: false,
          }}
          rowKey="taskId"
          locale={{ emptyText: ZH_CN["no_data"] }}
        />
      </div>
      {visible && <RollbackModal visible={visible} onClose={hideRollbackModal} refresh={getRollbackList} />}
    </>
  );
}
