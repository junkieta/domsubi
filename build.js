const { build } = require("esbuild");

const isDev = process.env.NODE_ENV === '"development"';

build({
  define: { "process.env.NODE_ENV": process.env.NODE_ENV },
  target: "es2020",
  platform: "browser",
  entryPoints: ["./src/Lib.ts"],
  outfile: "dist/domsubi.js",
  bundle: true,
  format: "esm",
  minify: !isDev,
  sourcemap: true//isDev,
}).catch((err) => console.log(`Error: ${JSON.stringify(err)}`));