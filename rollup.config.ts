import typescript from "rollup-plugin-typescript2";

const config = [
    {
        input:"src/bin.ts",
        output:{
            format:"es",
            banner:"#!/usr/bin/env node",
            file:"./dist/bin.js"
        },
        plugins:[
            typescript()
        ]
    }
]
export default config;