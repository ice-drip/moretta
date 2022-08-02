import { mergeWith } from "lodash-es";
import { relative, resolve } from "path";
import { MorettaInfo, MultiConfig } from "../types/common.interface";
import { mergeCustomizer } from "../utils/common.util";
import { GitUtil } from "../utils/git.util";
export class StyleLint {
  private git: GitUtil;
  private basePath: string;
  private files: string;

  constructor(git: GitUtil, files: string,  basePath: string) {
    this.git = git;
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
    const records: Record<string, MorettaInfo[]> = {};
    const resultJson: StylelintOutput[] = JSON.parse(result);
    resultJson.some((item) => {
      item.warnings.map((warn) => {
        const blame = this.git.blame(resolve(item.source), warn.line);
        const file = relative(this.basePath, resolve(item.source));
        if (!records[file]) {
          records[file] = [];
        }
        records[file].push([
          "stylelint",
          blame?.committer || "unknown",
          blame?.committer_time || "unknown",
          warn.rule,
          `${warn.line} - ${warn.endLine}`,
          warn.severity,
          blame || null,
          file,
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

export async function execStylelint(
  pattern: string | MultiConfig[],
  git: GitUtil,
  basePath: string
) {
  if (typeof pattern === "string") {
    const stylelint = new StyleLint(git, pattern,  basePath);
    return await stylelint.lint();
  }
  else if (pattern instanceof Array) {
    let records: Record<string, MorettaInfo[]> = {};
    for(let i = 0;i<pattern.length;i++){
      const item = await execStylelint(pattern[i].command, git, resolve(basePath,pattern[i].base_path))
      records = mergeWith(records, item, mergeCustomizer);
    }
    return records;
  }
}
