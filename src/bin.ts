import { ESLint } from "eslint";
import Table, { HorizontalTableRow } from "cli-table3";
import { ESLintOutput } from "./types/eslint.interface";
import { GitUtil } from "./utils/git.util";
import { relative, resolve } from "path";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2))

const basePath = process.cwd();
const projectPath = argv.file;
(async () => {
  const eslint = new ESLint({ cache: true });

  const result = await eslint.lintFiles(resolve(basePath,projectPath));
  const formatter = await eslint.loadFormatter("json");
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
  const table = new Table({head:["user","time","error lint","line","severity"]});
  const tableArr:HorizontalTableRow[] = [];
  const git = new GitUtil(basePath);
  res.some((item) => {
    const filePath = relative(basePath, item.filePath as string);
    tableArr.push([{ colSpan: 5, content: filePath }]); 
    item.messages?.some((msg) => {
      const blame = git.blame(filePath, msg.line, msg.endLine);
      tableArr.push([
        blame?.user,
        blame?.time,
        msg.ruleId,
        `${msg.line} - ${msg.endLine}`,
        msg.severity,
      ]);
    });
  });
  if(tableArr.length>1){
    table.push(...tableArr);
    console.log(table.toString());
    throw new Error("moretta: more error in files")
  }else{
    console.log("moretta: no error in files");
  }
})();
