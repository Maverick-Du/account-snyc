import { Drawer, Input, message, Modal, Tooltip } from "antd";
import { useContext, useEffect, useState } from "react";
import { fullSyncApi } from "@/api/fullSync";
import { camel, getEnumKeyByValue, formatTime, getFullDeptSync, getFullUserDeptSync, getFullUserSync } from "@/utils";
import { IFullSyncDetail } from "@/types/fullSync";
import downloadPng from "@/assets/download.png";
import {
  AUTO_SYNC,
  FULL_SYNC_CANCEL,
  FULL_SYNC_ERROR,
  FULL_SYNC_RANGE_WARN,
  FULL_SYNC_SUCCESS,
  FULL_SYNC_THRESHOLD_WARN,
  FULL_SYNC_WAIT,
  fullStatusEnum,
  ROLL_RETRY_SYNC,
  SYNC_FULL_SETTING_RANGE,
  syncTypeEnum,
} from "@/constants";
import style from "./style.module.less";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
import { RetrySettingModal } from "../modal";
import { SettingContext } from "@/page";
interface IProps {
  taskId: string;
  visible: boolean;
  onClose: () => void;
  refresh: () => void;
}
const Textarea = Input.TextArea;

export default function FullSyncDrawer(props: IProps) {
  const { visible, onClose, taskId, refresh } = props;
  const { setFullSettingType, setShowFullSetting } = useContext(SettingContext);
  const [detail, setDetail] = useState({} as IFullSyncDetail);
  // 展示全量同步重试设置面板
  const [showSetting, setShowSetting] = useState(false);

  useEffect(() => {
    if (!visible || !taskId) return;

    fullSyncApi.getFullSyncDetail({ taskId }).then((res) => setDetail(camel(res?.data)));
  }, [taskId, visible]);

  const closeSetting = () => setShowSetting(false);

  const downloadError = () => {
    if (detail?.errorMsg && (detail?.status === FULL_SYNC_RANGE_WARN || detail?.status === FULL_SYNC_THRESHOLD_WARN))
      fullSyncApi.downloadWarnData({ taskId });
    else if (detail?.errorMsg) fullSyncApi.downloadErrorData({ taskId });
  };

  const downloadDetail = () => fullSyncApi.downloadDetailData({ taskId });

  const showIgnoreModal = () => {
    const { taskId } = detail;
    Modal.confirm({
      title: ZH_CN["full_sync_ignore_modal_title"],
      content: `当前自动同步程序已暂停，您可选择 忽略 任务ID：${taskId} 全量任务，忽略异常后，默认开启自动同步程序同步最新数据`,
      cancelText: ZH_CN["full_sync_ignore_modal_cancel"],
      autoFocusButton: null,
      okText: ZH_CN["full_sync_ignore_modal_ok"],
      onOk: () =>
        fullSyncApi.ignoreFullSync({ taskId }).then((res) => {
          if (res) {
            message.success(ZH_CN["full_sync_ignore_success"]);
            refresh();
          }
        }),
      centered: true,
    });
  };

  const showRetryModal = async () => {
    const { taskId, status } = detail;
    Modal.confirm({
      title: ZH_CN["full_sync_retry_modal_title"],
      content:
        status === FULL_SYNC_SUCCESS
          ? `当前任务同步成功但有异常数据，仅支持全量任务重试`
          : `当前自动同步程序已暂停，您可选择任务ID：${taskId} 全量任务进行重试。重试成功后自动同步程序自动恢复；若任务重试失败，可选择再次重试或者手动开启自动同步程序同步最新数据`,
      cancelText: ZH_CN["full_sync_retry_modal_cancel"],
      cancelButtonProps: { type: "primary" },
      autoFocusButton: null,

      okText: ZH_CN["full_sync_retry_modal_ok"],
      okType: "default",
      onOk: () => setShowSetting(true),
      centered: true,
    });
  };

  const setRange = () => {
    setShowFullSetting(true);
    setFullSettingType(SYNC_FULL_SETTING_RANGE);
  };

  return (
    <Drawer
      title={ZH_CN["sync_detail"]}
      onClose={onClose}
      visible={visible}
      className={style["full-sync-drawer"]}
      width={530}
    >
      <div className={style["detail-title"]}>{ZH_CN["full_sync_task_info"]}</div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_task_id"]}：</div>
        <div>{detail?.taskId}</div>
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_way"]}：</div>
        {/* 处理两种重试同步情况 */}
        <div>
          {detail?.syncType === ROLL_RETRY_SYNC
            ? getEnumKeyByValue(syncTypeEnum, AUTO_SYNC)
            : getEnumKeyByValue(syncTypeEnum, detail?.syncType)}
        </div>
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_operator"]}：</div>
        <div>{detail?.operator}</div>
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_status"]}：</div>
        <div
          style={{
            color:
              detail?.status === FULL_SYNC_ERROR
                ? "#EA0000"
                : detail?.status === FULL_SYNC_THRESHOLD_WARN || detail?.status === FULL_SYNC_RANGE_WARN
                ? "#F72F04"
                : "#000",
          }}
        >
          {detail?.status === FULL_SYNC_RANGE_WARN
            ? fullStatusEnum[FULL_SYNC_THRESHOLD_WARN]
            : fullStatusEnum[detail?.status]}
        </div>
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_cost_time"]}：</div>
        <div>
          {ZH_CN["full_sync_sync_time"]}：
          {detail?.status === FULL_SYNC_SUCCESS || detail?.status === FULL_SYNC_ERROR
            ? formatTime((new Date(detail?.endTime).valueOf() - new Date(detail?.beginTime).valueOf()) / 1000)
            : "--"}
          ；{ZH_CN["full_sync_collect_time"]}：
          {detail?.status !== FULL_SYNC_WAIT && detail?.collectCost ? formatTime(detail?.collectCost) : "--"}
        </div>
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_start_time"]}：</div>
        <div>{detail?.beginTime ? new Date(detail?.beginTime).toLocaleString() : "--"}</div>
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_end_time"]}：</div>
        <div>{detail?.endTime ? new Date(detail?.endTime).toLocaleString() : "--"}</div>
      </div>

      <div className={style["detail-title"]}>
        {ZH_CN["full_sync_data_detail"]}
        {(detail?.status === FULL_SYNC_SUCCESS || detail?.status === FULL_SYNC_ERROR) && (
          <span className={style["download_sync_detail"]} onClick={downloadDetail}>
            {ZH_CN["full_sync_download_sync_detail"]}
          </span>
        )}
      </div>

      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_dept_sync"]}：</div>
        <Textarea style={{ width: 360, height: 120 }} value={getFullDeptSync(detail)} />
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_user_sync"]}：</div>
        <Textarea style={{ width: 360, height: 120 }} value={getFullUserSync(detail)} />
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_sync_user_dept"]}：</div>
        <Textarea style={{ width: 360, height: 120 }} value={getFullUserDeptSync(detail)} />
      </div>

      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["full_sync_exception_reason"]}：</div>
        <Textarea style={{ width: 360, height: 120 }} value={detail?.errorMsg || "--"} />
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>
          {detail?.status === FULL_SYNC_RANGE_WARN || detail?.status === FULL_SYNC_THRESHOLD_WARN
            ? ZH_CN["full_sync_warn_detail"]
            : ZH_CN["full_sync_exception_detail"]}
          ：
        </div>
        <div className={style["download_sync_error"]}>
          {detail?.errorMsg ? (
            detail?.status === FULL_SYNC_CANCEL ? (
              <>--</>
            ) : (
              <div onClick={downloadError}>
                <img src={downloadPng} alt="" width={20} style={{ margin: "0 10px" }} />
                {detail?.status === FULL_SYNC_RANGE_WARN || detail?.status === FULL_SYNC_THRESHOLD_WARN
                  ? ZH_CN["full_sync_download_warn_data"]
                  : ZH_CN["full_sync_download_exception_data"]}
              </div>
            )
          ) : (
            <>--</>
          )}
        </div>
      </div>
      {
        // 成功有异常数据
        detail?.status === FULL_SYNC_SUCCESS && detail?.errorMsg && (
          <div className={style["detail-item"]}>
            <div className={style["label"]}>{ZH_CN["sync_handle"]}：</div>
            <div>
              <div className={style["actions"]}>
                {detail.isRetry ? (
                  <span className={style["action"]} onClick={showRetryModal}>
                    {ZH_CN["sync_retry"]}
                  </span>
                ) : (
                  <Tooltip title={ZH_CN["full_sync_retry_modal_cannot_retry"]}>
                    <a style={{ color: "#767676", cursor: "not-allowed" }}>{ZH_CN["sync_retry"]}</a>
                  </Tooltip>
                )}
              </div>
              <div className={style["tip"]}>{ZH_CN["full_sync_retry_tip"]}</div>
            </div>
          </div>
        )
      }
      {
        // 异常
        detail?.status === FULL_SYNC_ERROR && (
          <div className={style["detail-item"]}>
            <div className={style["label"]}>{ZH_CN["sync_handle"]}：</div>
            <div>
              <div className={style["actions"]}>
                {detail.isRetry ? (
                  <span className={style["action"]} onClick={showRetryModal}>
                    {ZH_CN["sync_retry"]}
                  </span>
                ) : (
                  <Tooltip title={ZH_CN["full_sync_retry_modal_cannot_retry"]}>
                    <a style={{ color: "#767676", cursor: "not-allowed" }}>{ZH_CN["sync_retry"]}</a>
                  </Tooltip>
                )}
                <span className={style["divide"]}>|</span>
                {detail.isIgnore ? (
                  <span className={style["action"]} onClick={showIgnoreModal}>
                    {ZH_CN["sync_ignore"]}
                  </span>
                ) : (
                  <Tooltip title={ZH_CN["full_sync_ignore_modal_cannot_ignore"]}>
                    <a style={{ color: "#767676", cursor: "not-allowed" }}>{ZH_CN["sync_ignore"]}</a>
                  </Tooltip>
                )}
              </div>
              <div className={style["tip"]}>{ZH_CN["full_sync_retry_tip"]}</div>
              <div className={style["tip"]}>{ZH_CN["full_sync_ignore_tip"]}</div>
            </div>
          </div>
        )
      }
      {
        // 范围变更警告
        detail?.status === FULL_SYNC_RANGE_WARN && (
          <div className={style["detail-item"]}>
            <div className={style["label"]}>{ZH_CN["sync_handle"]}：</div>
            <div>
              <div className={style["actions"]}>
                <span className={style["action"]} onClick={setRange}>
                  {ZH_CN["full_sync_range"]}
                </span>
              </div>
              <div className={style["tip"]}>{ZH_CN["full_sync_range_tip"]}</div>
            </div>
          </div>
        )
      }
      {showSetting && (
        <RetrySettingModal refresh={refresh} taskId={taskId} visible={showSetting} onClose={closeSetting} />
      )}
    </Drawer>
  );
}
