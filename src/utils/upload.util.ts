import fetch from "node-fetch";

export abstract class UploadUtil {
  public static uploadWarning(url: string, ak: string,warnings:Array<Warning>) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:JSON.stringify({ak,warnings})
    });
  }
}
export interface Warning{
    "project_name": string;
    "hash": string;
    "type": string;
    "user": string;
    "time": string;
    "rule": string;
    "position": string;
    "severity": string;
    file_path:string
  }
  