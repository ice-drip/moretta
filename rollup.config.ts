import typescript from "rollup-plugin-typescript2";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

const config = [
  {
    input: "src/bin.ts",
    output: {
      format: "es",
      banner: "#!/usr/bin/env node",
      file: "./dist/bin.js",
    },
    plugins: [
      typescript(),
      getBabelOutputPlugin({
        presets: [["@babel/preset-env", { useBuiltIns: "usage", corejs: "3.24.1" }]],
      }),
    ],
  },
];
export default config;
