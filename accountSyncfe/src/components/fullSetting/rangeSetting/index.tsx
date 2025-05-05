import { useContext, useEffect, useState } from "react";
import ZH_CN from "../../../assets/i18n/locales/zh-CN";
import style from "../style.module.less";
import { SYNC_FULL_SETTING_DEFAULT } from "@/constants";
import { Button, Checkbox, Spin, Tree } from "antd";
import { fullSyncApi } from "@/api/fullSync";
import { SettingContext } from "@/page";
import { ConfirmModal } from "./modal/confirm";

interface IPosition {
  pos: string;
  node: RangeNode;
}

interface RangeNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  children?: RangeNode[];

  name: string;
  subs: RangeNode[];
  platform_id: string;
  did: string;
  check_type: number;
}

const prefix = "::cur_dept_all_user:";

export default function RangeSetting() {
  const [isSearching, setIsSearching] = useState(false);
  const [id, setId] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const { setFullSettingType } = useContext(SettingContext);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rangeList, setRangeList] = useState<RangeNode[]>([]);
  const [deleteList, setDeleteList] = useState<{ name: string }[]>([]);
  const [submitKeys, setSubmitKeys] = useState<string[]>([]);

  const onExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue as string[]);
    setAutoExpandParent(false);
  };

  const closeSetting = async () => setFullSettingType(SYNC_FULL_SETTING_DEFAULT);

  useEffect(() => {
    refresh();
  }, []);

  const handleData = (data: RangeNode[], expanded: string[], checked: string[]): RangeNode[] => {
    return data.map((item) => {
      const { name, subs, platform_id, did, check_type } = item;
      const key = JSON.stringify({ name, platform_id, did });
      if (check_type === 1) checked.push(key);
      // 如果不是部门下所有用户 并且有子部门 放入展开列表
      if (!did.startsWith(prefix) && subs.length !== 0) expanded.push(key);

      return {
        ...item,
        title: name,
        key,
        isLeaf: did.startsWith(prefix),
        children: handleData(subs, expanded, checked),
      };
    });
  };

  const getRangeList = async (node?: RangeNode) => {
    const res = await fullSyncApi.getFullSyncRangeList(node || {});

    const newExpandedKeys = [...expandedKeys] as string[];
    const newCheckedKeys = [...checkedKeys] as string[];

    if (res) {
      setId(res?.data?.task_id);
      const scope = res?.data?.scope || {};
      scope.title = scope.name;
      scope.key = JSON.stringify({ name: scope.name, platform_id: scope.platform_id, did: scope.did });
      scope.children = handleData(scope.subs, newExpandedKeys, newCheckedKeys);

      if (node && node.key) {
        setRangeList((origin) => updateTreeData(origin, node.key, scope.children));
      } else setRangeList([scope]);

      // 初始展开第一层特殊处理
      if (!node) {
        setExpandedKeys([...newExpandedKeys, scope.key]);
        // 如果全部选中 则只添加根部门
        if (scope.check_type === 1) {
          setCheckedKeys([scope.key]);
          setSubmitKeys([scope.key]);
        } else {
          setCheckedKeys(newCheckedKeys);
          setSubmitKeys(newCheckedKeys);
        }
      }

      setDeleteList(res?.data?.deleteScopes || []);
    }
  };

  const refresh = async () => {
    setIsSearching(true);
    await getRangeList();
    setIsSearching(false);
  };

  function filterStrings(array: IPosition[]) {
    const result: string[] = [];
    const posResult: string[] = [];
    // 先排序 避免出现检测到前缀但是前缀字符串在后面的情况
    const sortArray = array.sort((a, b) => a.pos.localeCompare(b.pos));
    // 遍历数组
    for (let i = 0; i < sortArray.length; i++) {
      const currentStr = sortArray[i].pos;

      // 检查当前字符串是否有任何其他字符串作为前缀
      const isPrefix = posResult.some((str) => str !== currentStr && currentStr.startsWith(`${str}-`));

      // 如果当前字符串没有任何其他字符串的前缀，保留它
      if (!isPrefix) {
        result.push(sortArray[i].node.key);
        posResult.push(currentStr);
      }
    }
    return result;
  }

  const onCheck = (checked: React.Key[], { checkedNodesPositions }: { checkedNodesPositions: IPosition[] }) => {
    const filterCheckedKeys = filterStrings(checkedNodesPositions);
    setCheckedKeys(checked as string[]);
    setSubmitKeys(filterCheckedKeys);
  };

  const closeConfirm = () => setShowConfirm(false);

  const openConfirm = () => setShowConfirm(true);

  const updateTreeData = (list: RangeNode[], key: React.Key, children: RangeNode[]): RangeNode[] =>
    list.map((node) => {
      if (node.key === key) return { ...node, children };

      if (node.children) return { ...node, children: updateTreeData(node.children, key, children) };

      return node;
    });

  return (
    <>
      <div className={style["setting-title"]}>{ZH_CN["full_sync_setting_range"]}</div>
      <div className={style["setting-tip"]}>{ZH_CN["full_sync_setting_range_tips"]}</div>
      <div className={style["range-item"]}>
        <div className={style["range-info"]}>
          {rangeList?.length > 0 ? (
            <>
              {ZH_CN["full_sync_setting_range_title_front"]}
              <span className={style["range-id"]}>{id}</span>
              {ZH_CN["full_sync_setting_range_title_back"]}
            </>
          ) : (
            ZH_CN["full_sync_setting_range_title_no_data"]
          )}
          <span className={style["range-refresh"]} onClick={refresh}>
            {ZH_CN["sync_refresh"]}
          </span>
        </div>
        {isSearching ? (
          <div className={style["range-spin"]}>
            <Spin indicator={<>{ZH_CN["full_sync_setting_range_wait_tips"]}</>} />
          </div>
        ) : rangeList.length > 0 ? (
          <Tree
            className={style["range-tree"]}
            checkable
            onExpand={onExpand}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            // @ts-ignore d.ts有误
            onCheck={onCheck}
            checkedKeys={checkedKeys}
            selectable={false}
            treeData={rangeList}
            loadData={getRangeList}
          />
        ) : (
          <div className={style["range-spin"]}>{ZH_CN["no_data"]}</div>
        )}
      </div>
      {deleteList.length > 0 && (
        <>
          <div className={style["setting-tip"]}>{ZH_CN["full_sync_setting_range_del_tips"]}</div>
          <div className={style["range-item"]}>
            <div className={style["del-list"]}>
              {deleteList.map((item, index) => (
                <div className={style["del-item"]} key={index}>
                  <Checkbox checked disabled /> {item.name}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className={style["setting-tip-border"]}></div>
      <div className={style["setting-item"]}>
        <Button type="primary" style={{ width: 96 }} onClick={openConfirm}>
          {ZH_CN["sync_confirm"]}
        </Button>
        <Button style={{ width: 96, marginLeft: 20 }} onClick={closeSetting}>
          {ZH_CN["sync_cancel"]}
        </Button>
      </div>
      <ConfirmModal
        checkedKeys={submitKeys}
        visible={showConfirm}
        onClose={closeSetting}
        closeConfirm={closeConfirm}
        taskId={id}
      />
    </>
  );
}
