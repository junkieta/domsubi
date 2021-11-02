import typescript from 'rollup-plugin-typescript2';
//import {nodeResolve} from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
//import commonjs from '@rollup/plugin-commonjs';

export default [
    {
        input: './src/Lib.ts',

        external: ['sodiumjs'],

        output: [
            { file: "dist/domsubi.js", format: 'esm', sourcemap: true },
            { file: 'dist/domsubi.min.js', format: 'esm', plugins: [terser({ module: true })] }
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
