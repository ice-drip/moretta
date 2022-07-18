import { Blame } from "../utils/git.util";

type LintType = "vue-tsc" | "eslint" | "stylelint" | "tsc" | "prettier";

export type MorettaInfo = [
  LintType,
  string,
  string,
  string,
  string,
  string,
  Blame|null
];
