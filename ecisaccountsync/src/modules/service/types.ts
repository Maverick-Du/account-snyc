import {FullSyncScopeSchema} from "../db/tables/FullSyncScope";

export interface FullSyncScopeCheckData {
    platform_id: string
    did: string
    name: string
}

export interface FullSyncScopeData {
    task_id: string
    platform_id: string
    did: string
    name: string
    check_type: CheckType
    subs: FullSyncScopeData[]
}

export interface FullSyncScopeResponseData {
    task_id: string
    scope: FullSyncScopeData
    deleteScopes:  FullSyncScopeCheckData[]
}

export interface FullSyncScopeParentChainData {
    pidSet: Set<string>
    deleteScopes:  FullSyncScopeSchema[]
}

export enum CheckType {
    NO = 0,
    YES = 1
}
