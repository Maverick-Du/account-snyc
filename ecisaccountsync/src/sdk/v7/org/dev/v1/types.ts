import { AccountInfo, Department, Member } from '../../../tenant'
import {WPS4Result} from "../../../../common/wps4";
import {DeptAndWeight, WpsSource} from "../../../../account";

export interface GetCompanyDeptResult extends WPS4Result {
  data: Department;
}

export interface GetBatchCompanyDeptsResult extends WPS4Result {
  data: {
    depts: Department[];
  };
}

export interface QueryDeptsByThirdUnionIdResult extends WPS4Result {
  data: {
    depts: Department[];
    total: number;
  };
}

export interface PutCompanyDeptMembersOrderReset {
  user_id: string;
  dept_id: string;
  order: number;
}

export interface PostCompanyDeptResult extends WPS4Result {
  data: Department;
}

export interface BatchCreateChildDeptsInfo {
  code: string;
  resutl: string;
  dept_id: string;
  name: string;
  alias: string;
  third_platform_id: string;
  third_union_id: string;
  weight: number;
  source: string;
}

export interface BatchCreateChildDeptsResult extends WPS4Result {
  failure: BatchCreateChildDeptsInfo[];
  failure_count: number;
  success: BatchCreateChildDeptsInfo[];
  success_count: number;
}

export interface UpdateCompanyDeptResult extends WPS4Result {}

export interface MoveCompanyDeptResult extends WPS4Result {}

export interface DelCompanyDeptResult extends WPS4Result {}

export interface GetCompanyUserResult extends WPS4Result {
  data: AccountInfo;
}

export interface BatchGetCompanyUsersResult extends WPS4Result {
  data: {
    company_members: AccountInfo[];
    total: number;
  };
}

export interface GetDeptUsersResult extends WPS4Result {
  data: {
    dept_members: Member[];
  };
}

export interface CompanyDept {
    third_platform_id: string;
    third_union_id: string;
    name: string;
    weight: number;
    source: 'sync';
    type?: string
}

export interface CompanyUser {
  account: string,
  avatar?: string,
  custom_fields?: [{
    field_id: string,
    relation_obj?: string,
    relation_objs?: string[],
    text?: string,
    url?: {
      link: string,
      title: string
    }
  }],
  def_dept_id: string,
  dept_ids: [
    {
      dept_id: string,
      weight: number,
    }
  ],
  email?: string,
  employee_id?: string,
  employment_status?: string,
  employment_type?: string,

  gender?: string,
  leader?: string,
  mobile_phone?: string,
  nick_name: string,
  password?: string,
  source: WpsSource,
  telephone?: string,

  third_platform_id: string,
  third_union_id: string,

  title?: string,
  work_place?: string,
}

export interface UpdateCompanyUser {
  login_name?: string,
  avatar?: string,
  custom_fields?: [{
    field_id: string,
    relation_obj?: string,
    relation_objs?: string[],
    text?: string,
    url?: {
      link: string,
      title: string
    }
  }],
  email?: string,
  employee_id?: string,
  employment_status?: string,
  employment_type?: string,
  gender?: string,
  leader?: string,
  mobile_phone?: string,
  nick_name?: string,
  source?: WpsSource,
  telephone?: string,
  title?: string,
  work_place?: string
}

export interface EnableCompanyUserResult extends WPS4Result {}

export interface DisableCompanyUserResult extends WPS4Result {}

export interface AddUser2DeptResult extends WPS4Result {}

export interface DelUserDeptResult extends WPS4Result {}

export interface ChangeUserDeptResult extends WPS4Result {}

export interface UpdateDeptUserSortResult extends WPS4Result {}

export interface ChangeUserDept {
  account_id: string;
  def_dept_id: string;
  new_dept_ids: {
    dept_id: string;
    weight: number;
  }[];
  old_dept_ids: string[];
}
