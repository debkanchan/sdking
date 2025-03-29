import { GeneratorOptions, OpenAPISpec } from "./types.js";
import { parseOpenAPISpec } from "./parser.js";
import { extractSchemas, generateSchemaFiles } from "./schema-generator.js";
import {
  extractRoutes,
  generateRouteFiles,
  generateAliasFile,
} from "./route-generator.js";
import { generateConfigFile, generateIndexFile } from "./config-generator.js";
import fs from "fs";
import path from "path";
import { FileWriter, DirMaker } from "../utils/fs.js";

/**
 * Main SDK generator function
 */
export async function generateSDK(
  options: GeneratorOptions,
  writeFile: FileWriter,
  mkdir: DirMaker,
): Promise<void> {
  const { inputPath, outputDir, verbose, importPrefix } = options;

  // Step 1: Parse the OpenAPI spec
  if (verbose) console.info("Parsing OpenAPI spec...");
  const spec = await parseOpenAPISpec(inputPath);

  // Step 2: Create output directory if it doesn't exist
  mkdir(outputDir, { recursive: true });

  // Step 3: Extract and process schemas
  if (verbose) console.info("Extracting schemas...");
  const schemas = extractSchemas(spec);

  // Step 4: Generate schema files
  if (verbose) console.info(`Generating ${schemas.length} schema files...`);
  generateSchemaFiles(schemas, outputDir, importPrefix, writeFile, mkdir);

  // Step 5: Extract and process routes
  if (verbose) console.info("Extracting routes...");
  const routes = extractRoutes(spec);

  // Step 6: Generate route files
  if (verbose) console.info(`Generating ${routes.length} route files...`);
  generateRouteFiles(routes, outputDir, importPrefix, writeFile, mkdir);

  // Step 7: Generate alias file for operationIds
  if (verbose) console.info("Generating alias file for operationIds...");
  generateAliasFile(routes, outputDir, importPrefix, writeFile);

  // Step 8: Generate config file
  if (verbose) console.info("Generating configuration file...");
  generateConfigFile(spec, outputDir, writeFile);

  // Step 9: Generate main index file
  if (verbose) console.info("Generating index file...");
  generateIndexFile(outputDir, importPrefix, writeFile);

  // Step 10: Generate package.json for the SDK (if it doesn't exist)
  // if (!fs.existsSync(path.join(outputDir, 'package.json'))) {
  //   if (verbose) console.info('Generating package.json...');
  //   generatePackageJson(spec, outputDir, writeFile);
  // }

  // Step 11: Generate README.md (if it doesn't exist)
  if (!fs.existsSync(path.join(outputDir, "README.md"))) {
    if (verbose) console.info("Generating README.md...");
    generateReadme(spec, outputDir, writeFile);
  }

  if (verbose) console.info("SDK generation completed successfully!");
}

/**
 * Generates a package.json file for the SDK
 */
// function generatePackageJson(spec: OpenAPISpec, outputDir: string, writeFile: FileWriter): void {
//   const packageName = spec.info.title.toLowerCase().replace(/\s+/g, '-');

//   const packageJson = {
//     name: packageName,
//     version: spec.info.version,
//     description: `TypeScript SDK for ${spec.info.title}`,
//     main: 'dist/index.js',
//     types: 'dist/index.d.ts',
//     scripts: {
//       build: 'tsc',
//       prepare: 'npm run build'
//     },
//     files: [
//       "dist"
//     ],
//     dependencies: {
//       "zod": "^3.22.4"
//     },
//     peerDependencies: {},
//     devDependencies: {
//       "typescript": "^5.3.2"
//     }
//   };

//   writeFile(
//     path.join(outputDir, 'package.json'),
//     JSON.stringify(packageJson, null, 2)
//   );
// }

/**
 * Generates a README.md file for the SDK
 */
function generateReadme(
  spec: OpenAPISpec,
  outputDir: string,
  writeFile: FileWriter,
): void {
  const title = spec.info.title;
  const version = spec.info.version;
  const description = spec.info.description || "";

  const readme = `# ${title} SDK

TypeScript SDK for ${title} API v${version}.

${description}

## Installation

\`\`\`bash
npm install [package-name]
\`\`\`

## Usage

\`\`\`typescript
import { sdkConfig } from '[package-name]';
import { pet } from '[package-name]/routes';

// Configure the SDK
sdkConfig.baseUrl = 'https://your-api-url.com';
sdkConfig.headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
};

// Use the SDK
async function example() {
  try {
    // Example API call
    const result = await pet.getPets();
    console.log(result);
  } catch (error) {
    console.error('API Error:', error);
  }
}

example();
\`\`\`

## API Reference

This SDK is generated from an OpenAPI specification. All endpoints and data models are strongly typed with TypeScript.

### Configuration

You can configure the SDK by modifying the \`sdkConfig\` object:

\`\`\`typescript
import { sdkConfig } from '[package-name]';

sdkConfig.baseUrl = 'https://your-api-url.com';
sdkConfig.headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'X-Custom-Header': 'Custom Value'
};
\`\`\`

## License

MIT
`;

  writeFile(path.join(outputDir, "README.md"), readme);
}
