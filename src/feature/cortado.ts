import { MorettaInfo } from "../types/common.interface";
import { HmacRIPEMD160 } from "@kaffee/espresso";
import { UploadUtil, Warning } from "../utils/upload.util";
export class Cortado {
  private token: string;
  private api: string;
  constructor(token: string, api: string) {
    this.token = token;
    this.api = api;
  }

  public async upload(list: MorettaInfo[],project_name:string) {
    const res = await UploadUtil.uploadWarning(this.api,this.token,this.generateCortado(list,project_name));
    console.log("cortado upload success");
  }

  private generateCortado(list: MorettaInfo[],project_name:string):Warning[] {
    return list.map((data) => {
      const [type, user, time, rule, position, severity] = data;
      const hash = HmacRIPEMD160(project_name+data.join(","), "5p2O5qKT6JCM").toString();
      return { project_name,hash, type, user, time, rule, position, severity };
    });
  }
}
