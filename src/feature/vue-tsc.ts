import { exec } from "child_process";
import { strip } from "ansicolor";
import { GitUtil } from "../utils/git.util";
import { relative, resolve } from "path";
import { MorettaInfo, MultiConfig } from "../types/common.interface";
import { mergeCustomizer } from "../utils/common.util";
import { mergeWith } from "lodash-es";

export class VueTSC {
  private git: GitUtil;
  private pm: string;
  private basePath: string;
  private script: string;
  private projectPath:string;
  constructor(git: GitUtil, pm: string, basePath: string, script: string,projectPath:string) {
    this.git = git;
    this.pm = pm;
    this.basePath = basePath;
    this.script = script;
    this.projectPath = projectPath;
  }

  public async lint(): Promise<Record<string, MorettaInfo[]>> {
    let command = "";
    switch (this.pm) {
      case "pnpm":
        command = "pnpm " + this.script;
        break;
      case "yarn":
        command = "yarn " + this.script;
        break;
      default:
        command = "npm run " + this.script;
        break;
    }
    const records: Record<string, MorettaInfo[]> = {};
    const exec$ = new Promise<Array<VueTSCError>>((resolve, reject) => {
      exec(command, { cwd: this.basePath }, (error, stdout, stderr) => {
        if (stdout) {
          const reg = RegExp(
            "(.*?):([0-9]*?):([0-9]*?) - error (.*?): (.*?).(\r\n|\r|\n)",
            "g"
          );
          resolve(
            [...strip(stdout.toString()).matchAll(reg)].map((item) => ({
              file: item[1],
              line: item[2],
              column: item[3],
              code: item[4],
              error: item[5],
            }))
          );
        }
        reject([]);
      });
    });
    const errList = await exec$;
    errList.some((item) => {
      const file = relative(this.projectPath,resolve(this.basePath,item.file)).replace("\\","/");
      if (!records[file]) {
        records[file] = [];
      }
      const blame = this.git.blame(
        file,
        Number(item.line),
      );
      records[file].push([
        "vue-tsc",
        blame?.committer||"unknown",
        blame?.committer_time||"unknown",
        item.code,
        `${item.line}:${item.column}`,
        "5",
        blame||null,
        file
      ]);
    });
    return records;
  }
}

export async function execVueTsc(
  pattern: string | MultiConfig[],
  git: GitUtil,
  basePath: string,
  pm:string
){
  if (typeof pattern === "string") {
    const vue_tsc = new VueTSC(git, pm, basePath, pattern,basePath);
    return await vue_tsc.lint()
  } else if (pattern instanceof Array) {
    let records: Record<string, MorettaInfo[]> = {};
    for(let i =0;i<pattern.length;i++){
      const vue_tsc = new VueTSC(git, pm, resolve(basePath,pattern[i]["base_path"]), pattern[i]["command"],basePath);
      records = mergeWith(records, await vue_tsc.lint(), mergeCustomizer);
    }
    return records
  }
}

interface VueTSCError {
  file: string;
  line: string;
  column: string;
  code: string;
  error: string;
}
