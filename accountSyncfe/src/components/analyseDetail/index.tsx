import { ProCard } from '@ant-design/pro-components';
import { Button, message, Modal, Select, Statistic, Table, Tooltip } from 'antd';
import styles from './index.module.less';
import {
  ACCOUNT_MIDDLE_TABLE_DATA,
  ANALYSE_TYPE,
  analyseNameMap,
  DEPT_SYNC_DATA,
  USER_SYNC_DATA,
  USER_DEPT_RELATION_SYNC_DATA,
  TIncrementSyncUpdateType,
  updateTypeEnum
} from '@/constants';
import { useEffect, useRef, useState } from 'react';
import { analyseStatusMap, AnalyseStatusEnum, syncTbTypeList, analyseStatusErrorMsg, updateTypeList, errorTypeList, analyseTableConfig } from '@/constants/analyse';
import ZH_CN from '@/assets/i18n/locales/zh-CN';
import { analyseApi } from '@/api/analyse';
import {
  InfoCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons';

interface Props {
  analyseTaskId: string;
  jumpToDetail: (search: Record<string, string>) => void;
}

export default function AnalyseDetail(props: Props) {

  // 分析状态
  const [analyseStatus, setAnalyseStatus] = useState<AnalyseStatusEnum>(AnalyseStatusEnum.UNSTART);

  // 中间表数据
  const [middleTableData, setMiddleTableData] = useState<any>({});

  // 全量同步任务数据
  const [fullSyncTaskData, setFullSyncTaskData] = useState<any>({});

  // 错误数据分析
  const [total, setTotal] = useState<number>(0);
  const [current, setCurrent] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [errorData, setErrorData] = useState([]);

  // 中间表类型
  const [syncTbType, setSyncTbType] = useState<string>("dept");
  // 操作类型
  const [updateType, setUpdateType] = useState<string>("");
  // 错误类型
  const [errorType, setErrorType] = useState<string>("");

  let timer: any = useRef();

  const changeCurrent = (page: number) => setCurrent(page);

  const columns = [
    {
      title: ZH_CN["full_sync_task_id"],
      dataIndex: "task_id",
      ellipsis: true,
    },
    {
      title: ZH_CN["sync_table_type"],
      dataIndex: "sync_tb_type",
      ellipsis: true,
      render: (sync_tb_type: string) => {
        return syncTbTypeList[sync_tb_type as keyof typeof syncTbTypeList];
      }
    },
    {
      title: ZH_CN["sync_operate_type"],
      dataIndex: "operate_type",
      ellipsis: true,
      render: (text: TIncrementSyncUpdateType) => updateTypeEnum?.[text] || "--"
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
      title: ZH_CN["count"],
      dataIndex: "count",
      ellipsis: true,
    },
    {
      title: ZH_CN["analyse_action"],
      dataIndex: "action",
      ellipsis: true,
      render: (_: any, record: any) => {
        return (
          <>
            <Button type="link" onClick={() => jumpToErrorDetail(record)}>错误详情</Button>
          </>
        )
      }
    }
  ]

  // 跳转错误详情
  const jumpToErrorDetail = (record: any) => {
    props.jumpToDetail({
      syncTbType: record.sync_tb_type,
      updateType: record.operate_type,
      errorType: record.err_type
    })
  }

  // 初始获取分析状态
  const initGetAnalyseStatus = async () => {
    const resp = await analyseApi.getAnalyseStatus(props.analyseTaskId);
    if (resp.data.status === AnalyseStatusEnum.ANALYSING) {
      // 开始轮询
      timer.current = setInterval(() => {
        pollGetAnalyseStatus();
      }, 3000)
    } else if (resp.data.status === AnalyseStatusEnum.ANALYSESUCCESS) {
      getMiddleTableData();
      getFullSyncTaskData();
      getErrorDataList(current - 1, pageSize, syncTbType, updateType, errorType);
    }
    setAnalyseStatus(resp.data.status);
  }

  // 轮询获取分析状态
  const pollGetAnalyseStatus = async () => {
    try {
      const res = await analyseApi.getAnalyseStatus(props.analyseTaskId);
      if (res.data.status === AnalyseStatusEnum.ANALYSESUCCESS) {
        clearInterval(timer.current);
        // 获取整体数据
        getMiddleTableData();
        getFullSyncTaskData();
        getErrorDataList(current - 1, pageSize, syncTbType, updateType, errorType);
      } else if (res.data.status === AnalyseStatusEnum.ANALYSEFAIL || res.data.status === AnalyseStatusEnum.ANALYSESTOPSUCCESS) {
        clearInterval(timer.current);
      }
      setAnalyseStatus(res.data.status);
    } catch (error) {
      message.error("获取分析状态失败");
    }
  }

  // 开始分析
  const startAnalyse = async () => {
    try {
      const res = await analyseApi.startAnalyse(props.analyseTaskId);
      if (!res.data.is_analyse) {
        Modal.warning({
          title: "分析失败",
          content: analyseStatusErrorMsg[res.data.stat as keyof typeof analyseStatusErrorMsg],
        })
        return;
      }
      // 立刻获取一次分析状态
      initGetAnalyseStatus();
    } catch (error) {
      message.error('开始分析失败');
    }
  };

  // 终止分析
  const stopAnalyse = async () => {
    try {
      await analyseApi.stopAnalyse(props.analyseTaskId);
      const resp = await analyseApi.getAnalyseStatus(props.analyseTaskId);
      if (resp.data.status === AnalyseStatusEnum.ANALYSESTOPING) {
        timer.current = setInterval(() => {
          pollGetAnalyseStatus();
        }, 3000)
      }
      setAnalyseStatus(resp.data.status);
    } catch (error) {
      message.error('终止分析失败');
    }
  }

  // 获取中间表数据
  const getMiddleTableData = async () => {
    try {
      const res = await analyseApi.getMiddleTableAnalyseData(props.analyseTaskId);
      setMiddleTableData(res.data);
    } catch (error) {
      message.error('获取中间表数据失败');
    }
  }

  // 获取全量同步任务数据
  const getFullSyncTaskData = async () => {
    try {
      const res = await analyseApi.getFullSyncDetail(props.analyseTaskId);
      setFullSyncTaskData(res.data);
    } catch (error) {
      message.error('获取全量同步任务数据失败');
    }
  }

  // 获取错误数据分析
  const getErrorDataList = async (offset: number, limit: number, sync_tb_type?: string, operate_type?: string, err_type?: string) => {
    try {
      const res = await analyseApi.getAnalyseErrorData({
        task_id: props.analyseTaskId,
        offset,
        limit,
        sync_tb_type,
        operate_type,
        err_type
      })
      setErrorData(res?.data?.rows);
      setTotal(res?.data?.total);
    } catch (error) {
      message.error('获取错误数据分析失败');
    }
  };

  // 手动查询错误数据分析
  const queryErrorData = () => {
    if (current === 1) {
      getErrorDataList(current - 1, pageSize, syncTbType, updateType, errorType);
    } else {
      setCurrent(1);
    }
  };

  // 重置查询条件
  const resetCondition = () => {
    setSyncTbType("dept");
    setUpdateType("");
    setErrorType("");
    getErrorDataList(0, pageSize, "dept", "", "");
  };

  // 分析面板初始化
  const analyseInit = async () => {
    try {
      // 立刻获取一次分析状态
      initGetAnalyseStatus();
    } catch (error) {
      message.error('获取分析状态失败');
    }
  };

  useEffect(() => {
    // 获取错误数据分析
    if (analyseStatus === AnalyseStatusEnum.ANALYSESUCCESS) {
      getErrorDataList(current - 1, pageSize, syncTbType, updateType, errorType);
    }
  }, [current])

  useEffect(() => {
    // 初始化
    analyseInit();
    return () => {
      clearInterval(timer.current);
    }
  }, [])

  return <>
    <div className={styles['analyse-detail']}>
      <div style={{ marginLeft: "20px" }}>
        {(analyseStatus === AnalyseStatusEnum.UNSTART || analyseStatus === AnalyseStatusEnum.ANALYSEFAIL || analyseStatus === AnalyseStatusEnum.ANALYSESTOPSUCCESS) && <Button onClick={startAnalyse} type="primary">{ZH_CN["start_analyse"]}</Button>}
        {analyseStatus === AnalyseStatusEnum.ANALYSING && <Button onClick={stopAnalyse} type="primary" danger>{ZH_CN["stop_analyse"]}</Button>}
        <p style={{ marginTop: "10px" }}>
          {ZH_CN["current_status"]}：
          {(analyseStatus === AnalyseStatusEnum.ANALYSESTOPING || analyseStatus === AnalyseStatusEnum.ANALYSING) && <LoadingOutlined style={{ marginRight: "10px" }} />}
          <span style={
            analyseStatus === AnalyseStatusEnum.ANALYSESUCCESS ? { color: "green" } :
              analyseStatus === AnalyseStatusEnum.ANALYSEFAIL ? { color: "red" } : { color: "inherit" }
          }>{analyseStatusMap.get(analyseStatus)}</span>
        </p>
      </div>
      {ANALYSE_TYPE.map((type) => {
        // 模块类型
        const showType = analyseTableConfig[type as keyof typeof analyseTableConfig]?.type;
        // 数据配置
        const analyseData = analyseTableConfig[type as keyof typeof analyseTableConfig]?.analyseData
        // 公式配置
        const formulaConfigs = analyseTableConfig[type as keyof typeof analyseTableConfig]?.formulaConfig;
        let valueData: any;
        // 获取对应卡片的元数据
        switch (type as keyof typeof analyseTableConfig) {
          case ACCOUNT_MIDDLE_TABLE_DATA:
            valueData = middleTableData;
            break;
          case DEPT_SYNC_DATA:
            valueData = fullSyncTaskData?.dept;
            break;
          case USER_SYNC_DATA:
            valueData = fullSyncTaskData?.user;
            break;
          case USER_DEPT_RELATION_SYNC_DATA:
            valueData = fullSyncTaskData?.dept_user;
            break;
        }
        return (
          <>
            <ProCard.Group className={styles['procard-group']} bodyStyle={{ display: "flex", flexWrap: "wrap" }} bordered wrap title={
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {analyseNameMap.get(type)}
              </span>
            } direction={'row'}>
              {showType === "card" && <>
                {analyseData.map((item: any, index: number) => {
                  return (
                    <>
                      <ProCard style={{ width: "24%" }}>
                        <Statistic title={<>
                          {item.label}
                          <Tooltip title={item.tip}>
                            <InfoCircleFilled className={styles['tooltip']} />
                          </Tooltip>
                        </>} value={valueData?.[item.key]?.toString() || ZH_CN["not_yet"]} />
                      </ProCard>
                      {index % 4 !== 3 && index !== analyseData.length - 1 && <ProCard.Divider className={styles['procard-divider']} type='vertical'></ProCard.Divider>}
                    </>
                  );
                })}
                <div className={styles["formulaModule"]}>
                  <span className={styles["formulaTitle"]}>统计公式</span>
                  {formulaConfigs.map((formulaConfig: any) => {
                    // 判断是否可以展示
                    if (formulaConfig?.isShow && !formulaConfig?.isShow(valueData)) {
                      return <></>;
                    }
                    let resultValue: number | string = 0;
                    const resultType = formulaConfig.result.valueOriginType;
                    switch (resultType) {
                      case "get":
                        resultValue = valueData?.[formulaConfig.result.key]?.toString() || ZH_CN["not_yet"];
                        break;
                      case "calculate":
                        // 设置起始值
                        let calInitValue = valueData?.[formulaConfig.params[0].key];
                        // 先判断是否分析过
                        if (analyseStatus === AnalyseStatusEnum.ANALYSESUCCESS) {
                          formulaConfig.params.forEach((param: any, index: number) => {
                            if (param.sign === '+') {
                              calInitValue = Number(calInitValue) + Number(valueData?.[formulaConfig.params[index + 1].key])

                            } else if (param.sign === '-') {
                              calInitValue = Number(calInitValue) - Number(valueData?.[formulaConfig.params[index + 1].key])
                            }
                          });
                          resultValue = calInitValue.toString() || ZH_CN["not_yet"];
                        } else {
                          resultValue = ZH_CN["not_yet"];
                        }
                        break;
                    }
                    return (
                      <div className={styles["formulaItem"]}>
                        <Statistic className={styles["formulaStatistic"]} title={
                          <>
                            {formulaConfig.result.label}
                            {formulaConfig.tip && <Tooltip title={formulaConfig.tip}>
                              <InfoCircleFilled className={styles['tooltip']} />
                            </Tooltip>}
                          </>} value={resultValue} />
                        <span className={styles["formulaSign"]}> = </span>
                        {formulaConfig.params.map((param: any) => {
                          return <>
                            <Statistic className={styles["formulaStatistic"]} style={{ marginLeft: "20px" }} title={param.label} value={valueData?.[param.key]?.toString() || ZH_CN["not_yet"]} />
                            {param.sign && <span className={styles["formulaSign"]}> {param.sign} </span>}
                          </>
                        })}
                      </div>
                    )
                  })}
                </div>
              </>}
              {showType === "table" && <div>
                <div style={{ marginBottom: '10px' }}>
                  <span>{ZH_CN["sync_table_type"]}: </span>
                  <Select disabled={analyseStatus !== AnalyseStatusEnum.ANALYSESUCCESS} style={{ width: "150px", marginRight: "10px" }} size='small' value={syncTbType} onChange={(value: string) => {
                    setUpdateType("");
                    setErrorType("");
                    // setUserDeptContent("");
                    setSyncTbType(value)
                  }}>
                    {/* <Select.Option value="">{ZH_CN["all"]}</Select.Option> */}
                    <Select.Option value="dept">{ZH_CN["dept_table"]}</Select.Option>
                    <Select.Option value="user">{ZH_CN["user_table"]}</Select.Option>
                    <Select.Option value="dept_user">{ZH_CN["dept_user_relation_table"]}</Select.Option>
                  </Select>
                  <span>{ZH_CN["update_type"]}：</span>
                  <Select disabled={analyseStatus !== AnalyseStatusEnum.ANALYSESUCCESS} style={{ width: "150px", marginRight: "10px" }} size='small' value={updateType} onChange={(value: string) => setUpdateType(value)}>
                    <Select.Option value="">{ZH_CN["all"]}</Select.Option>
                    {updateTypeList[syncTbType as keyof typeof updateTypeList].map((item) => {
                      return <Select.Option key={item.key} value={item.key}>{item.label}</Select.Option>
                    })}
                  </Select>
                  <span>{ZH_CN["error_type"]}：</span>
                  <Select disabled={analyseStatus !== AnalyseStatusEnum.ANALYSESUCCESS} style={{ width: "200px", marginRight: "10px" }} size='small' value={errorType} onChange={(value: string) => setErrorType(value)}>
                    <Select.Option value="">{ZH_CN["all"]}</Select.Option>
                    {errorTypeList[syncTbType as keyof typeof errorTypeList].map((item) => {
                      return <Select.Option key={item.key} value={item.key}>{item.label}</Select.Option>
                    })}
                  </Select>
                  <Button size="small" disabled={analyseStatus !== AnalyseStatusEnum.ANALYSESUCCESS} style={{ marginRight: '10px' }} type="primary" onClick={queryErrorData}>{ZH_CN["sync_search"]}</Button>
                  <Button size="small" disabled={analyseStatus !== AnalyseStatusEnum.ANALYSESUCCESS} type="primary" onClick={resetCondition}>{ZH_CN["reset"]}</Button>
                </div>
                <Table
                  columns={columns}
                  dataSource={errorData}
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
              </div>}
            </ProCard.Group>
          </>
        )
      })}
    </div>
  </>
}