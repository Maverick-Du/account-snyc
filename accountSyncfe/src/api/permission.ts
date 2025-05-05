import http from ".";

export class permissionApi {
  static code: number | undefined = 20000000;

  static getInfo() {
    const url = "/accounts/u/v1/session/info";
    return http.get(url, "cloud", this.code);
  }

  static getPermission(companyId: string) {
    const url = `/role/admin/v1/companies/${companyId}/permissions`;
    return http.get(url, "cloud", this.code);
  }
}
