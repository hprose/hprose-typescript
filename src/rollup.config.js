import typescript from "rollup-plugin-typescript2";

export default [
    {
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
    },
    {
        input: "./hprose.html5.ts",
        output: {
            format: "es",
            file: '../dist/hprose.html5.js',
            sourcemap: true,
            banner: "/* eslint-disable */",
        },
        plugins: [
            typescript(),
        ]
    },
    {
        input: "./hprose.node.ts",
        output: {
            format: "es",
            file: '../dist/hprose.node.js',
            sourcemap: true,
            banner: "/* eslint-disable */",
        },
        plugins: [
            typescript(),
        ]
    }
];
