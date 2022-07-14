import Table, { HorizontalTableRow } from "cli-table3";
import { GitUtil } from "./utils/git.util";
import { strip } from "ansicolor";
import { ESLintFeature } from "./feature/eslint";
import { resolve } from "path";
import { VueTSC } from "./feature/vue-tsc";
import { readFileSync } from "fs";
import { isArray, mergeWith } from "lodash-es";
import { Tsc } from "./feature/tsc";
import { StyleLint } from "./feature/stylelint";

function mergeCustomizer<T>(objValue: Array<T>, srcValue: Array<T>) {
  if (isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

const basePath = process.cwd();
const config = JSON.parse(
  readFileSync(resolve(basePath, "moretta.config.json")).toString()
);
const pm = config["pm"] ? config["pm"] : "npm";
console.log("project manange: "+pm);
(async () => {
  const git = new GitUtil(basePath);
  const table = new Table({
    head: ["type", "user", "time", "error lint", "line", "severity"],
  });
  const user: Record<string, string> = config.contributor
    ? config.contributor
    : {};
  const tableArr: HorizontalTableRow[] = [];
  let records: Record<string, (string | undefined)[][]> = {};
  if (config.eslint) {
    const ESLint = (await import("eslint")).ESLint;
    const eslint = new ESLintFeature(
      new ESLint({cache:true}),
      resolve(basePath, config.eslint),
      git,
      basePath
    );
    records = mergeWith(records, await eslint.lint(), mergeCustomizer);
  }
  if (config["vue-tsc"]) {
    const vue_tsc = new VueTSC(git, pm, basePath, "lint:vue-tsc");
    records = mergeWith(records, await vue_tsc.lint(), mergeCustomizer);
  }

  if (config["tsc"]) {
    const tsc = new Tsc(git, pm, basePath, "lint:tsc");
    records = mergeWith(records, await tsc.lint(), mergeCustomizer);
  }

  if(config["stylelint"]){
    const stylelint = new StyleLint(git,config["stylelint"],pm,basePath)
    records = mergeWith(records, await stylelint.lint(), mergeCustomizer);
  }

  Object.keys(records)
    .sort((x, y) => x.localeCompare(y))
    .some((key) => {
      tableArr.push(["file", { colSpan: 5, content: key }]);
      tableArr.push(
        ...records[key].map((item) => {
          if (item[1] && user[item[1]]) {
            item[1] = user[item[1]];
          }
          return item;
        })
      );
    });

  if (tableArr.length > 1) {
    table.push(...tableArr);
    console.log(strip(table.toString()));
    process.exit(1);
  } else {
    console.log("moretta: no error in files");
  }
})();