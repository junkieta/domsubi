import pkg from './package.json';
import typescript from 'rollup-plugin-typescript2';
import {terser} from 'rollup-plugin-terser';

export default [
    {
        input: './src/Lib.ts',

        external: ['sodiumjs'],

        output: [
            { file: pkg.main, format: 'cjs', sourcemap: true },
            { file: pkg.module, format: 'esm', sourcemap: true },
            { file: 'dist/domsubi.js', format: 'esm', plugins: [terser({ module: true })] }
        ],

        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        module: "es2020",
                        target: "es2020",
                        declaration: true,
                        moduleResolution: "node"
                    }
                },
                useTsconfigDeclarationDir: true,
            })
        ]
    }
];
