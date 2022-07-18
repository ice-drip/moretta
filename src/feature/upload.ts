import { MorettaInfo } from "../types/common.interface";
import { HmacRIPEMD160 } from "@kaffee/espresso";
export class Cortado {
  private token: string;
  private api: string;
  constructor(token: string, api: string) {
    this.token = token;
    this.api = api;
  }

  public upload(list: MorettaInfo[]): void {}

  private generateCortado(list: MorettaInfo[],projectName:string) {
    return list.map((data) => {
      const [type, user, time, rule, position, severity] = data;
      const hash = HmacRIPEMD160(projectName+data.join(","), "5p2O5qKT6JCM").toString();
      return { hash, type, user, time, rule, position, severity };
    });
  }
}
