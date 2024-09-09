import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import json from '@rollup/plugin-json';
import commonjs from "@rollup/plugin-commonjs";
import terser from '@rollup/plugin-terser';
import * as path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dts } from "rollup-plugin-dts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), { encoding: "utf8" }));
const masterVersion = pkg.version;
const tsconfigFile = path.join(__dirname, 'tsconfig.json');

const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
];

function createPlugins() {
    const replaceValues = {
        __VERSION__: `${masterVersion}`,
        __BUILD_DATE__: `${Date.now()}`,
        __AUTHOR__: 'ywx1818@163.com'
    };
    const tsPlugin = typescript({
        clean: true,
        tsconfig: tsconfigFile,
        cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache')
    });
    const plugins = [
        json({ namedExports: false }),
        tsPlugin,
        replace({
            preventAssignment: true,
            values: replaceValues
        }),
        nodeResolve(),
        commonjs(),
    ];
    if (typeof process !== 'undefined' && process.env.BUILD === 'production') {
        plugins.push(terser({
            module: true,
            compress: {
                ecma: 2015,
                pure_getters: true
            },
            safari10: true,
            maxWorkers: 4
        }));
    }
    return plugins;
}

function getDtsConfig() {
    const input = path.join(__dirname, 'src/main.ts');
    const plugins = [dts()];
    const output = [{
        file: path.join(__dirname, `dist/index.d.ts`),
        format: 'es'
    }];
    return {input, plugins, output};
}

export default async (args) => {
    return [
        {
            input: {
                index: './src/main.ts',
            },
            output: {
                exports: 'named',
                sourcemap: true,
                freeze: false,
                format: 'es',
                externalLiveBindings: false,
                dir: 'dist',
                entryFileNames: `[name].es.js`
            },
            external,
            onwarn: (msg, warn) => {
                if (!/Circular/.test(msg)) {
                    warn(msg)
                }
            },
            treeshake: {
                moduleSideEffects: false
            },
            plugins: createPlugins()
        },
        getDtsConfig()
    ];
};