import { Blame } from "../utils/git.util";

type LintType = "vue-tsc" | "eslint" | "stylelint" | "tsc" | "prettier";
type Committer = string;
type CommitterTime = string;
type WarnRule = string;
type WarnPosition = string;
type WarnSeverity=string;
type FilePath = string;
export type MorettaInfo = [
  LintType,
  Committer,
  CommitterTime,
  WarnRule,
  WarnPosition,
  WarnSeverity,
  Blame|null,
  FilePath
];

export interface MultiConfig{
  base_path:string;
  command:string;
}