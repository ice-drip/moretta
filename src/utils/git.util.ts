import { execSync } from "child_process";
import dayjs from "dayjs";

export class GitUtil {
  private basePath: string;
  constructor(basePath?: string) {
    this.basePath = basePath ? basePath : process.cwd();
  }

  public blame(file: string, lineStart: number):Blame|null {
    const blameRes = this.runCommand(
      `git blame ${file} -L ${lineStart},${lineStart} -w --line-porcelain`
    );
    const blames = blameRes.split("\n")

    if (blames.length>3) {
      const [hash,sourceLine,resultLine,num_line] = blames[0].split(" ");
      const [,author] = splitOnce(blames[1]," ");
      const [,email] = splitOnce(blames[2]," ");
      const [,author_time] = splitOnce(blames[3]," ");
      const [,committer] = splitOnce(blames[5]," ");
      const [,committer_mail] = splitOnce(blames[6]," ");
      const [,committer_time] = splitOnce(blames[7]," ");
      const [,summary] = splitOnce(blames[9]," ");
      const [,filename] = splitOnce(blames[10]," ");
      const code = blames[11]
      return {
        hash,
        sourceLine,
        resultLine,
        num_line,
        author:author.trim(),
        email:email.trim(),
        author_time: dayjs.unix(Number(author_time)).format('YYYY-MM-DD HH:mm:ss'),
        committer:committer.trim(),
        committer_mail:committer_mail.trim(),
        committer_time: dayjs
          .unix(Number(committer_time))
          .format('YYYY-MM-DD HH:mm:ss'),
        summary:summary.trim(),
        filename:filename.trim(),
        code
      };
    } else {
      return null;
    }
  }

  private runCommand(command: string) {
    return execSync(command, { cwd: this.basePath }).toString();
  }
}

function splitOnce(str:string,comma:string){
  const firstLength = str.split(comma)[0].length;
  return [str.slice(0,firstLength+1),str.slice(firstLength)]
}

export interface Blame{
  hash: string;
  sourceLine: string;
  resultLine: string;
  num_line: string;
  author: string;
  email: string;
  author_time: string;
  committer: string;
  committer_mail: string;
  committer_time: string;
  summary: string;
  filename: string;
  code: string;
}
