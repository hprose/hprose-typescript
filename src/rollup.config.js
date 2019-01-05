import typescript from "rollup-plugin-typescript2";

export default {
    input: "./hprose.io.ts",
    output: {
        format: "es",
        file: '../dist/hprose.io.js',
        sourcemap: true,
        banner: "/* eslint-disable */",
    },
    plugins: [
        typescript(),
    ]
};
