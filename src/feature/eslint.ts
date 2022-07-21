import { ESLint } from "eslint";
import { relative } from "path";
import { MorettaInfo } from "../types/common.interface";
import { ESLintOutput } from "../types/eslint.interface";
import { GitUtil } from "../utils/git.util";

export class ESLintFeature {
  private eslint:ESLint;
  private files: string;
  private gitUtil: GitUtil;
  private basePath: string;
  constructor(eslint:ESLint,files: string, gitUtil: GitUtil, basePath: string) {
    this.files = files;
    this.gitUtil = gitUtil;
    this.basePath = basePath;
    this.eslint = eslint;
  }

  public async lint() {
    const result = await this.eslint.lintFiles(this.files);
    const formatter = await this.eslint.loadFormatter("json");
    const resultJson: ESLintOutput[] = JSON.parse(
      formatter.format(result) as string
    );
    const res = resultJson
      .filter(
        (item) =>
          (item.errorCount && item.errorCount > 0) ||
          (item.warningCount && item.warningCount > 0)
      )
      .map(
        ({
          filePath,
          messages,
          errorCount,
          fatalErrorCount,
          warningCount,
          fixableErrorCount,
          fixableWarningCount,
          usedDeprecatedRules,
        }) => ({
          filePath,
          messages,
          errorCount,
          fatalErrorCount,
          warningCount,
          fixableErrorCount,
          fixableWarningCount,
          usedDeprecatedRules,
        })
      );
    const records:Record<string, MorettaInfo[]> = {};
    res.some((item) => {
      const filePath = relative(this.basePath, item.filePath as string);
      if(records[filePath]===undefined){
        records[filePath] = []
      }
      item.messages?.some((msg) => {
        const blame = this.gitUtil.blame(filePath, msg.line);
        records[filePath].push([
          "eslint",
          blame?.committer||"unknow",
          blame?.committer_time||"unknow",
          msg.ruleId||"unknow",
          `${msg.line}-${msg.endLine}`,
          msg.severity?.toString()||"unknow",
          blame||null,
          filePath
        ])
      });
    });
    return records;
  }
}
