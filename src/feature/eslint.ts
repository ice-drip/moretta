import { ESLint } from "eslint";
import { mergeWith } from "lodash-es";
import { relative, resolve } from "path";
import { MorettaInfo, MultiConfig } from "../types/common.interface";
import { ESLintOutput } from "../types/eslint.interface";
import { mergeCustomizer } from "../utils/common.util";
import { GitUtil } from "../utils/git.util";

export class ESLintFeature {
  private eslint: ESLint;
  private files: string;
  private gitUtil: GitUtil;
  private basePath: string;
  private projectPath:string;
  constructor(
    eslint: ESLint,
    files: string,
    gitUtil: GitUtil,
    basePath: string,
    projectPath:string
  ) {
    this.files = files;
    this.gitUtil = gitUtil;
    this.basePath = basePath;
    this.eslint = eslint;
    this.projectPath = projectPath;
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
      const filePath = resolve(item.filePath as string);
      const file = relative(this.projectPath,filePath).replaceAll("\\","/");

      if (records[file] === undefined) {
        records[file] = [];
      }
      item.messages?.some((msg) => {
        const blame = this.gitUtil.blame(filePath, msg.line);
        records[file].push([
          "eslint",
          blame?.committer || "unknow",
          blame?.committer_time || "unknow",
          msg.ruleId || "unknow",
          `${msg.line}-${msg.endLine}`,
          msg.severity?.toString() || "unknow",
          blame || null,
          file,
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
  pattern: string | MultiConfig[],
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
        basePath,
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
          basePath,
          basePath
        );

        return await eslint.oldLint(CLIEngine);
      }
    }
  } else if (pattern instanceof Array) {
    let records: Record<string, MorettaInfo[]> = {};
    for(let i = 0;i<pattern.length;i++){
      const item = await execESLint(pattern[i].command, git, resolve(basePath,pattern[i].base_path))
      records = mergeWith(records, item, mergeCustomizer);
    }
  
    return records;
  }
  return null;
}
