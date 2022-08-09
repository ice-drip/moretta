import { strip } from "ansicolor";
import { exec } from "child_process";
import { relative, resolve } from "path";
import { MorettaInfo } from "../types/common.interface";
import { GitUtil } from "../utils/git.util";

export class Tsc{
    private git: GitUtil;
    private pm: string;
    private basePath: string;
    private script: string;
    constructor(git: GitUtil, pm: string, basePath: string,script:string) {
      this.git = git;
      this.pm = pm;
      this.basePath = basePath;
      this.script = script;
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
        const exec$ = new Promise<Array<TSCError>>((resolve, reject) => {
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
          const file = relative(this.basePath,resolve(item.file)).replaceAll("\\","/");
          if (!records[file]) {
            records[file] = [];
          }
          const blame = this.git.blame(resolve(this.basePath,file),Number(item.line));
          records[file].push([
            "tsc",
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

interface TSCError {
    file: string;
    line: string;
    column: string;
    code: string;
    error: string;
  }
  