import { isArray } from "lodash-es";

export function mergeCustomizer<T>(objValue: Array<T>, srcValue: Array<T>) {
    if (isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  }