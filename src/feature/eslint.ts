import { HorizontalTableRow } from "cli-table3";
import { ESLint } from "eslint";
import { relative } from "path";
import { ESLintOutput } from "../types/eslint.interface";
import { GitUtil } from "../utils/git.util";

export class ESLintFeature {
  private eslint = new ESLint({ cache: true });
  private files: string;
  private gitUtil: GitUtil;
  private basePath: string;
  constructor(files: string, gitUtil: GitUtil, basePath: string) {
    this.files = files;
    this.gitUtil = gitUtil;
    this.basePath = basePath;
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
    const records:Record<string,(string|undefined)[][]> = {};
    res.some((item) => {
      const filePath = relative(this.basePath, item.filePath as string);
      if(records[filePath]===undefined){
        records[filePath] = []
      }
      item.messages?.some((msg) => {
        const blame = this.gitUtil.blame(filePath, msg.line, msg.endLine);
        records[filePath].push([
          "eslint",
          blame?.user,
          blame?.time,
          msg.ruleId,
          `${msg.line}-${msg.endLine}`,
          msg.severity?.toString(),
        ])
      });
    });
    return records;
  }
}
