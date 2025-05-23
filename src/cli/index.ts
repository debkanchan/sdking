#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import { generateSDK } from "../lib/generator.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { mkDir, writeFile } from "../utils/fs.js";

// Get package version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, "../../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

const program = new Command();

program
  .name("codegen")
  .description("OpenAPI SDK generator using TypeScript and Zod")
  .version(packageJson.version)
  .requiredOption("-i, --input <path>", "Path or URL to the OpenAPI YAML spec")
  .requiredOption(
    "-o, --output <directory>",
    "Output directory for the generated SDK",
  )
  .option(
    "-p, --import-prefix <prefix>",
    'Import prefix for generated files (.js, .ts, or false for no prefix). Defaults to ".ts"',
    ".js",
  )
  .option("-v, --verbose", "Enable verbose logging", false)
  .action(async (options) => {
    try {
      const { input, output, verbose, importPrefix } = options;

      console.info(`Generating SDK from ${input} to ${output}`);

      if (importPrefix && ![".js", ".ts", "false"].includes(importPrefix)) {
        throw new Error(
          'Invalid import prefix. Must be ".js", ".ts", or false.',
        );
      }

      // Convert string "false" to boolean false
      const normalizedImportPrefix =
        importPrefix === "false" ? false : importPrefix;

      await generateSDK(
        {
          inputPath: input,
          outputDir: output,
          verbose: !!verbose,
          importPrefix: normalizedImportPrefix as ".js" | ".ts" | false,
        },
        writeFile,
        mkDir,
      );

      console.info("SDK generated successfully");
    } catch (error) {
      console.error("Error generating SDK:", error);
      process.exit(1);
    }
  });

program.parse();
