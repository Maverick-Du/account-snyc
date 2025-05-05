import { permissionApi } from "@/api/permission";
import { MENU_KEY } from "@/constants";
import { getFlattenPermissions } from "@/utils";
import { useEffect, useState } from "react";

export function usePermissions() {
  const [has, setHas] = useState<boolean>(false);
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const res = await hasPermission(MENU_KEY);
    setHas(res);
  };

  const hasPermission = async (permission_key: string) => {
    try {
      const {
        data: { company_id },
      } = await permissionApi.getInfo();
      const {
        data: { menu_tree },
      } = await permissionApi.getPermission(company_id);
      if (!menu_tree.length) return false;
      const flatPermission = getFlattenPermissions(menu_tree);

      return flatPermission.includes(permission_key);
    } catch (e) {
      return false;
    }
  };

  return { has };
}
