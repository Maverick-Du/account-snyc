type PermissionItem = {
  created_at: number;
  description: string;
  id: number;
  key: string;
  level: string;
  name: string;
  ternary_type: string;
  updated_at: number;
};

export type IMenuPermissionList = {
  description: string;
  id: number;
  is_show: boolean;
  key: string;
  level: string;
  name: string;
  parent_id: number;
  parent_key: string;
  permissions: PermissionItem[];
  sort: number;
  sub_menu: IMenuPermissionList[];
};

export const getFlattenPermissions = (permissions: any) => {
  const flatPermission: string[] = [];

  const TRAVEL_LEVEL = 4;

  function travelPermission(originPermissions: IMenuPermissionList[], level = 1) {
    originPermissions.forEach((item: IMenuPermissionList) => {
      if (item.is_show) flatPermission.push(item.key);
      else return;

      if (item.sub_menu && level < TRAVEL_LEVEL) travelPermission(item.sub_menu, level + 1);
    });
  }

  travelPermission(permissions);

  return flatPermission;
};
