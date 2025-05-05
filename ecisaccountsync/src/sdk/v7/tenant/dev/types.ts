import { Tenant } from '../models'
import {WPS4Result} from "../../../common/wps4";

export interface GetTenantDetailsResult extends WPS4Result {
    data: {
        tenants: Tenant[]
    }
}

export interface GetTenantDetailResult extends WPS4Result {
    data: Tenant
}

export interface InitTenantAdminResult extends WPS4Result {

}
