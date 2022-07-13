export interface ESLintOutput {
  filePath?: string;
  messages?: Message[];
  suppressedMessages?: Message[];
  errorCount?: number;
  fatalErrorCount?: number;
  warningCount?: number;
  fixableErrorCount?: number;
  fixableWarningCount?: number;
  source?: string;
  usedDeprecatedRules?: any[];
}

export interface Message {
  ruleId?: string;
  severity?: number;
  message?: string;
  line: number;
  column?: number;
  nodeType?: null | string;
  endLine: number;
  endColumn?: number;
  messageId?: string;
  fix?: Fix;
  suppressions?: Suppression[];
}

export interface Fix {
  range?: number[];
  text?: string;
}

export interface Suppression {
  kind?: string;
  justification?: string;
}
