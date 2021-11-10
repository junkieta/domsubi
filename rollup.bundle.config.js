import pkg from './package.json';
import licenses from './dependecies-license.json';
import typescript from 'rollup-plugin-typescript2';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

const my_license = {
    "name": pkg.name,
    "version": pkg.version,
    "homepage": pkg.homepage,
    "copy": `Copyright (c) 2021 ${pkg.author.name}`,
    "license": pkg.license,
    "dependencies": licenses
}

const license_text = "/*!\n" + create_license_text(my_license) + " */";

export default [
    {
        input: 'src/bundle.ts',

        output: [
            {
                name: 'domsubi',
                globals: { sodiumjs: 'Sodium' },
                file: 'dist/domsubi.umd.js',
                format: 'umd',
            },
            {
                name: 'domsubi',
                globals: { sodiumjs: 'Sodium' },
                file: 'docs/domsubi.umd.js',
                format: 'umd',
            },
            {
                file: 'dist/domsubi.min.js',
                format: 'esm',
            }
        ].map((o) => Object.assign({
            plugins: [terser({ module: true })],
            sourcemap: true,
            banner: license_text
        },o)),

        plugins: [
            nodeResolve({
                browser: true,
                transformMixedEsModules: true
            }),
            commonjs({
                exclude: ".ts"
            }),
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        module: "es2020",
                        target: "es2020",
                        declaration: false,
                        moduleResolution: "node"
                    }
                }
            })
        ]
    }
];

function create_license_text(data, required_by) {
    const name = data.version ? `${data.name} v${data.version}` : data.name;
    const next = data.dependencies;
    const text = [
        required_by ? `${name} (required by ${required_by})` : name,
        data.homepage,
        data.copy,
        `License: ${data.license}`
    ]
        .map((s) => ` * ${s}\n`)
        .join("");

    return next
        ? text.concat(" *\n", next.map((d) => create_license_text(d, data.name)).join(" *\n"))
        : text;
}
