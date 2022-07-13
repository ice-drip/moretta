import Table, { HorizontalTableRow } from "cli-table3";
import { GitUtil } from "./utils/git.util";
import { strip } from "ansicolor";
import { ESLintFeature } from "./feature/eslint";
import { resolve } from "path";
import { VueTSC } from "./feature/vue-tsc";
import { readFileSync } from "fs";
import {isArray, mergeWith} from "lodash-es";

function mergeCustomizer<T>(objValue:Array<T>,srcValue:Array<T>){
  if(isArray(objValue)){
    return objValue.concat(srcValue)
  }
}


const basePath = process.cwd();
const config = JSON.parse(
  readFileSync(resolve(basePath, "moretta.config.json")).toString()
);
(async () => {
  const git = new GitUtil(basePath);
  const table = new Table({
    head: ["type","user", "time", "error lint", "line", "severity"],
  });
  const user:Record<string,string> = config.contributor?config.contributor:{};
  const tableArr: HorizontalTableRow[] = [];
  let records: Record<string, (string | undefined)[][]> = {};
  if (config.eslint) {
    const eslint = new ESLintFeature(
      resolve(basePath, config.eslint),
      git,
      basePath
    );
    // records = Object.assign({}, records, await eslint.lint());
    records = mergeWith(records,await eslint.lint(),mergeCustomizer)
  }
  if (config["vue-tsc"]) {
    const vue_tsc = new VueTSC(git, "pnpm", basePath);
    records = mergeWith(records,await vue_tsc.lint(),mergeCustomizer)
  }
  Object.keys(records).sort((x,y)=>x.localeCompare(y)).some((key) => {
    tableArr.push(["file",{ colSpan: 5, content: key }]);
    tableArr.push(...records[key].map(item=>{
      if(item[1]&&user[item[1]]){
        item[1] = user[item[1]]
      }
      return item;
    }));
  });

  if (tableArr.length > 1) {
    table.push(...tableArr);
    console.log(strip(table.toString()));
    throw new Error("moretta: more error in files");
  } else {
    console.log("moretta: no error in files");
  }
})();
