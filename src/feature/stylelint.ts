import { relative, resolve } from "path";
import { GitUtil } from "../utils/git.util";
export class StyleLint {
  private git: GitUtil;
  private pm: string;
  private basePath: string;
  private files: string;

  constructor(git: GitUtil, files: string, pm: string, basePath: string) {
    this.git = git;
    this.pm = pm;
    this.basePath = basePath;
    this.files = files;
  }

  async lint() {
    const lint = (await import("stylelint")).default.lint;
    const result: string = (
      await lint({
        cwd: this.basePath,
        files: this.files,
        formatter: "json",
        maxWarnings: 0,
      })
    ).output;
    const records: Record<string, (string | undefined)[][]> = {};
    const resultJson: StylelintOutput[] = JSON.parse(result);
    resultJson.some((item) => {
      item.warnings.map((warn) => {
        const blame = this.git.blame(
          resolve(item.source),
          warn.line,
          warn.endLine
        );
        const file = relative(this.basePath, resolve(item.source));
        if (!records[file]) {
          records[file] = [];
        }
        records[file].push([
          "stylelint",
          blame?.user,
          blame?.time,
          warn.rule,
          `${warn.line} - ${warn.endLine}`,
          warn.severity,
        ]);
      });
    });
    return records;
  }
}

export interface StylelintOutput {
  source: string;
  deprecations: any[];
  invalidOptionWarnings: any[];
  parseErrors: any[];
  errored: boolean;
  warnings: Warning[];
}

export interface Warning {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  rule: string;
  severity: string;
  text: string;
}
