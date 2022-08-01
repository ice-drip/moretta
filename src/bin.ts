import Table, { HorizontalTableRow } from "cli-table3";
import { GitUtil } from "./utils/git.util";
import { strip } from "ansicolor";
import { ESLintFeature, execESLint } from "./feature/eslint";
import { resolve } from "path";
import { execVueTsc, VueTSC } from "./feature/vue-tsc";
import { readFileSync } from "fs";
import { mergeWith } from "lodash-es";
import { Tsc } from "./feature/tsc";
import { execStylelint, StyleLint } from "./feature/stylelint";
import { MorettaInfo } from "./types/common.interface";
import { Cortado } from "./feature/cortado";
import { mergeCustomizer } from "./utils/common.util";

const basePath = process.cwd();
const config = JSON.parse(
  readFileSync(resolve(basePath, "moretta.config.json")).toString()
);
const pm = config["pm"] ? config["pm"] : "npm";
console.log("project manange: " + pm);
(async () => {
  const git = new GitUtil(basePath);
  const table = new Table({
    head: ["type", "user", "time", "error lint", "line", "severity"],
  });
  const user: Record<string, string> = config.contributor
    ? config.contributor
    : {};
  const tableArr: HorizontalTableRow[] = [];
  let records: Record<string, MorettaInfo[]> = {};
  if (config.eslint) {
    const result = await execESLint(config.eslint, git, basePath);
    if (result) {
      records = mergeWith(records, result, mergeCustomizer);
    }
  }
  if (config["vue-tsc"]) {
    const vue_tsc = await execVueTsc(config["vue-tsc"],git,basePath,pm);
    records = mergeWith(records, vue_tsc, mergeCustomizer);
  }

  if (config["tsc"]) {
    const tsc = new Tsc(git, pm, basePath, "lint:tsc");
    records = mergeWith(records, await tsc.lint(), mergeCustomizer);
  }

  if (config["stylelint"]) {
    const stylelint = await execStylelint(config["stylelint"],git,basePath);
    if(stylelint){
      records = mergeWith(records, stylelint, mergeCustomizer);
    }
  }

  if (config["api"] && config["ak"]) {
    const cortado = new Cortado(config["ak"], config["api"]);
    await cortado.upload(
      Object.keys(records).flatMap((key) => records[key]),
      config["project_name"] || "cortado"
    );
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
          return item.slice(0, 6) as string[];
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
