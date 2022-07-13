import { execSync, spawnSync } from "child_process";
import dayjs from "dayjs";

export class GitUtil {
  private basePath: string;
  constructor(basePath?: string) {
    this.basePath = basePath ? basePath : process.cwd();
  }

  public blame(file: string, lineStart: number, lineEnd: number) {
    const regex = new RegExp(`([a-z0-9]{8}) \\((.*?) (.*?) [0-9]*?\\)(.*)`, "g");
    const blameRes = this.runCommand(
      `git blame ${file} -L ${lineStart},${lineEnd}`
    );
    const res = regex.exec(blameRes);
    if (res) {
      return {
        origin: res[0],
        id: res[1],
        user: res[2],
        time: dayjs(res[3]).format("YYYY-MM-DD HH:mm:ss"),
        code: res[5],
      };
    } else {
      return null;
    }
  }

  private runCommand(command: string) {
    return execSync(command, { cwd: this.basePath }).toString();
  }
}
