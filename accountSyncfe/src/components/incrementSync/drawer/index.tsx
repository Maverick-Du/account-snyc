import React, { useEffect, useState } from "react";
import { Drawer, Input } from "antd";
import style from "./style.module.less";
import { camel, getEnumKeyByValue } from "@/utils";
import { IIncrementSyncDetail } from "@/types/incrementSync";
import { incrementSyncApi } from "@/api/incrementSync";
import {
  INCREMENT_SYNC_ERROR,
  incrementStatusEnum,
  syncTypeEnum,
  TIncrementSyncType,
  TYPE_DEPT,
  TYPE_USER,
  TYPE_USER_DEPT,
  typeEnum,
  updateTypeEnum,
} from "@/constants";
import ZH_CN from "@/assets/i18n/locales/zh-CN";
interface IProps {
  visible: boolean;
  onClose: () => void;
  id: number;
  type?: TIncrementSyncType;
}

export default function SyncIncreasedDrawer(props: IProps) {
  const { visible, onClose, id, type } = props;
  const [detail, setDetail] = useState({} as IIncrementSyncDetail);
  useEffect(() => {
    if (!visible || !id || !type) return;
    incrementSyncApi.getIncrementSyncDetail({ id, type }).then((res) => {
      const detail = camel(res?.data);
      detail.type = detail?.updateType?.includes(TYPE_DEPT)
        ? detail?.updateType?.includes(TYPE_USER)
          ? TYPE_USER_DEPT
          : TYPE_DEPT
        : TYPE_USER;
      setDetail(detail);
    });
  }, [id, visible]);
  return (
    <Drawer
      title={ZH_CN["sync_detail"]}
      onClose={onClose}
      visible={visible}
      className={style["sync-increased-drawer"]}
      width={530}
    >
      <div className={style["detail-title"]}>{ZH_CN["increment_sync_task_info"]}</div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["increment_sync_time"]}：</div>
        <div>{new Date(detail?.mtime).toLocaleString()}</div>
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["increment_sync_way"]}：</div>
        <div>{getEnumKeyByValue(syncTypeEnum, detail?.syncType)}</div>
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["increment_sync_type"]}：</div>
        <div>{getEnumKeyByValue(typeEnum, detail?.type)}</div>
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["increment_sync_operator"]}：</div>
        <div>{detail?.operator}</div>
      </div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["increment_sync_result"]}：</div>
        <div style={{ color: detail?.status === INCREMENT_SYNC_ERROR ? "#EA0000" : "#000" }}>
          {incrementStatusEnum[detail?.status]}
        </div>
      </div>

      <div className={style["detail-title"]}>{ZH_CN["increment_sync_data_detail"]}</div>
      <div className={style["detail-item"]}>
        <div className={style["label"]}>{ZH_CN["increment_sync_operation"]}：</div>
        <div>{updateTypeEnum[detail?.updateType]}</div>
      </div>

      {detail?.jsonData && (
        <div className={style["detail-item"]}>
          <div className={style["label"]}>{ZH_CN["increment_sync_info"]}：</div>
          <Input.TextArea style={{ width: 360, height: 200 }} value={JSON.stringify(detail?.jsonData)} />
        </div>
      )}

      {detail?.status === INCREMENT_SYNC_ERROR && (
        <div className={style["detail-item"]}>
          <div className={style["label"]}>{ZH_CN["increment_sync_exception_reason"]}：</div>
          <Input.TextArea style={{ width: 360 }} value={detail?.msg} />
        </div>
      )}
    </Drawer>
  );
}
