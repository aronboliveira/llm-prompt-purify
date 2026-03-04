#!/usr/bin/env node
/**
 * Build script for LLM Prompt Purify extension
 * Compiles TypeScript and bundles for production
 */

import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const isProd = process.argv.includes("--prod");
const isWatch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: [path.join(rootDir, "src", "content.ts")],
  bundle: true,
  outfile: path.join(rootDir, "chromium-extension", "app", "content.js"),
  format: "iife",
  target: "es2020",
  minify: isProd,
  sourcemap: !isProd,
  logLevel: "info",
};

async function build() {
  console.log(
    `Building extension (${isProd ? "production" : "development"})...`,
  );

  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log("Watching for changes...");
    } else {
      const result = await esbuild.build(buildOptions);

      if (result.errors.length === 0) {
        const outPath = buildOptions.outfile;
        const stats = fs.statSync(outPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`\\n✓ Built successfully: ${outPath}`);
        console.log(`  Size: ${sizeKB} KB`);
      }
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
