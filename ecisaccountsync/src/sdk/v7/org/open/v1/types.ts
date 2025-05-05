import {KSO1Result} from "../../../../common/kso1";


export interface GetWpsOpenDeptResult extends KSO1Result {
    data: WpsOpenDepartment
}

export interface GetWpsOpenDeptsResult extends KSO1Result {
    data: {
        items: WpsOpenDepartment[]
    }
}

export interface WpsOpenDepartment {
    id: string,
    name: string,
    parent_id: string,
    ex_dept_id: string,
    abs_path: string,
    order: number,
    leaders: WpsOpenDeptLeader[]
    ctime: number,
}

export interface WpsOpenDeptLeader {
    user_id: string
    order: number
}

export interface GetWpsOpenAccessTokenResult extends KSO1Result {
    data: WpsOpenAccessToken
}

export interface WpsOpenAccessToken {
    access_token: string
    expires_in: number
    token_type: string
    expires_time: number
}
