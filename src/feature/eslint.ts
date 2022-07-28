import { ESLint } from "eslint";
import { mergeWith } from "lodash-es";
import { relative, resolve } from "path";
import { MorettaInfo } from "../types/common.interface";
import { ESLintOutput } from "../types/eslint.interface";
import { mergeCustomizer } from "../utils/common.util";
import { GitUtil } from "../utils/git.util";

export class ESLintFeature {
  private eslint: ESLint;
  private files: string;
  private gitUtil: GitUtil;
  private basePath: string;
  constructor(
    eslint: ESLint,
    files: string,
    gitUtil: GitUtil,
    basePath: string
  ) {
    this.files = files;
    this.gitUtil = gitUtil;
    this.basePath = basePath;
    this.eslint = eslint;
  }

  public async lint() {
    const result = await this.eslint.lintFiles(this.files);
    const formatter = await this.eslint.loadFormatter("json");
    return this.getFormat(JSON.parse(formatter.format(result) as string));
  }

  private getFormat(resultJson: ESLintOutput[]) {
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
    const records: Record<string, MorettaInfo[]> = {};
    res.some((item) => {
      const filePath = relative(this.basePath, item.filePath as string);
      if (records[filePath] === undefined) {
        records[filePath] = [];
      }
      item.messages?.some((msg) => {
        const blame = this.gitUtil.blame(filePath, msg.line);
        records[filePath].push([
          "eslint",
          blame?.committer || "unknow",
          blame?.committer_time || "unknow",
          msg.ruleId || "unknow",
          `${msg.line}-${msg.endLine}`,
          msg.severity?.toString() || "unknow",
          blame || null,
          filePath,
        ]);
      });
    });
    return records;
  }

  public async oldLint(cliEngine: any) {
    const iCliEngine = new cliEngine();
    const result = await iCliEngine.executeOnFiles(this.files);
    const formatter = await iCliEngine.getFormatter("json");
    return this.getFormat(JSON.parse(formatter(result)).results);
  }
}

export async function execESLint(
  pattern: string | string[],
  git: GitUtil,
  basePath: string
): Promise<Record<string, MorettaInfo[]> | null> {
  if (typeof pattern === "string") {
    const ESLint = (await import("eslint")).ESLint;
    if (ESLint) {
      const eslint = new ESLintFeature(
        new ESLint({ cache: true }),
        resolve(basePath, pattern),
        git,
        basePath
      );
      return await eslint.lint();
    } else {
      const CLIEngine = ((await import("eslint")) as any).CLIEngine;
      if (CLIEngine) {
        const eslint = new ESLintFeature(
          new CLIEngine({ cache: true }),
          resolve(basePath, pattern),
          git,
          basePath
        );

        return await eslint.oldLint(CLIEngine);
      }
    }
  } else if (pattern instanceof Array) {
    const resultList = pattern.map(
      async (item) => await execESLint(item, git, basePath)
    );
    let records: Record<string, MorettaInfo[]> = {};
    resultList.some(async (item) => {
      records = mergeWith(records, await item, mergeCustomizer);
    });
    return records;
  }
  return null;
}
