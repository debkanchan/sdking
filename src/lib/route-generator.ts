import { RouteInfo, OpenAPISpec, SchemaObject } from "./types.js";
import path from "path";
import { findSchemaRefs, generateZodSchema } from "./schema-generator.js";
import { DirMaker, FileWriter } from "../utils/fs.js";

/**
 * Extracts all routes from an OpenAPI spec
 */
export function extractRoutes(spec: OpenAPISpec): RouteInfo[] {
  const routes: RouteInfo[] = [];

  // Process each path in the OpenAPI spec
  for (const [pathUrl, pathItem] of Object.entries(spec.paths)) {
    // Process each HTTP method for the path
    for (const [method, operation] of Object.entries(pathItem)) {
      // Skip if not an operation (e.g., parameters, summary)
      if (!isHttpMethod(method)) {
        continue;
      }

      routes.push({
        path: pathUrl,
        method,
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description,
        parameters: [
          ...(pathItem.parameters || []),
          ...(operation.parameters || []),
        ],
        requestBody: operation.requestBody,
        responses: operation.responses,
      });
    }
  }

  return routes;
}

/**
 * Checks if a string is a valid HTTP method
 */
function isHttpMethod(
  method: string,
): method is
  | "get"
  | "post"
  | "put"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace" {
  return [
    "get",
    "post",
    "put",
    "delete",
    "options",
    "head",
    "patch",
    "trace",
  ].includes(method);
}

/**
 * Generates route files from extracted routes
 */
export function generateRouteFiles(
  routes: RouteInfo[],
  outputDir: string,
  importPrefix: ".js" | ".ts" | false,
  writeFile: FileWriter,
  mkdir: DirMaker,
): void {
  // Create routes directory
  const routesDir = path.join(outputDir, "routes");
  mkdir(routesDir, { recursive: true });

  // Group routes by path
  const routesByPath = groupRoutesByPath(routes);

  // Get all path segments that need intermediate index files
  const allPathSegments = getAllPathSegments(Array.from(routesByPath.keys()));

  // Generate a file for each route path
  for (const [routePath, pathRoutes] of routesByPath.entries()) {
    const filePath = getRouteFilePath(routePath, routesDir, ".ts");

    // Create directory if it doesn't exist
    const dirPath = path.dirname(filePath);
    mkdir(dirPath, { recursive: true });

    // Generate the route file
    const routeCode = generateRouteFile(
      routePath,
      pathRoutes,
      routesByPath,
      importPrefix,
    );
    writeFile(filePath, routeCode);
  }

  // Generate intermediate index files for path segments without endpoints
  generateIntermediateIndexFiles(
    allPathSegments,
    routesByPath,
    routesDir,
    importPrefix,
    writeFile,
    mkdir,
  );

  // Generate an index file to export all routes
  generateRoutesIndex(
    routesByPath,
    allPathSegments,
    outputDir,
    importPrefix,
    writeFile,
  );
}

/**
 * Groups routes by their path
 */
function groupRoutesByPath(routes: RouteInfo[]): Map<string, RouteInfo[]> {
  const routeMap = new Map<string, RouteInfo[]>();

  for (const route of routes) {
    if (!routeMap.has(route.path)) {
      routeMap.set(route.path, []);
    }

    routeMap.get(route.path)!.push(route);
  }

  return routeMap;
}

/**
 * Gets all unique path segments from routes that need intermediate index files
 * For example, from ["/core/api/v1/users", "/core/api/v1/organizations"]
 * it returns ["/core", "/core/api", "/core/api/v1"]
 */
function getAllPathSegments(routePaths: string[]): string[] {
  const segmentSet = new Set<string>();

  for (const routePath of routePaths) {
    const segments = routePath.split("/").filter(Boolean);

    // Generate all intermediate paths
    for (let i = 1; i < segments.length; i++) {
      const intermediatePath = "/" + segments.slice(0, i).join("/");
      segmentSet.add(intermediatePath);
    }
  }

  return Array.from(segmentSet).sort();
}

/**
 * Converts an OpenAPI path to a file path
 * Example: /pet => routes/pet/index.ts, /pet/{petId} => routes/pet/$petId/index.ts
 * Note: Always generates index.ts files regardless of import prefix
 */
function getRouteFilePath(
  routePath: string,
  routesDir: string,
  importPrefix: ".js" | ".ts" | false,
): string {
  // Convert path parameters to file paths with $ prefix
  // Example: /pet/{petId} => /pet/$petId
  const filePath = routePath
    .replaceAll("{", "$")
    .replaceAll("}", "") // Replace {param} with $param
    .split("/")
    .filter(Boolean) // Remove empty segments
    .join("/");

  // Always generate index.ts files, import prefix only affects imports within files
  return path.join(routesDir, filePath, `index${importPrefix ?? ""}`);
}

/**
 * Finds all direct child routes of a given parent route
 */
function findDirectChildRoutes(
  parentPath: string,
  allRoutes: Map<string, RouteInfo[]>,
): string[] {
  const childRoutes: string[] = [];
  const parentSegments = parentPath.split("/").filter(Boolean);
  const parentDepth = parentSegments.length;

  for (const routePath of allRoutes.keys()) {
    const segments = routePath.split("/").filter(Boolean);
    // Child route should have exactly one more segment than the parent
    // And all parent segments should match
    if (segments.length === parentDepth + 1) {
      let isChild = true;
      for (let i = 0; i < parentDepth; i++) {
        if (segments[i] !== parentSegments[i]) {
          isChild = false;
          break;
        }
      }
      if (isChild) {
        childRoutes.push(routePath);
      }
    }
  }

  return childRoutes;
}

/**
 * Generates intermediate index.ts files for path segments that don't have endpoints
 * but are needed for the nested route structure
 */
function generateIntermediateIndexFiles(
  allPathSegments: string[],
  routesByPath: Map<string, RouteInfo[]>,
  routesDir: string,
  importPrefix: ".js" | ".ts" | false,
  writeFile: FileWriter,
  mkdir: DirMaker,
): void {
  for (const segmentPath of allPathSegments) {
    // Skip if this path has actual endpoints
    if (routesByPath.has(segmentPath)) {
      continue;
    }

    // Find direct child routes/segments for this path
    const childRoutes = findDirectChildRoutes(segmentPath, routesByPath);
    const childSegments = findDirectChildSegments(
      segmentPath,
      allPathSegments,
      routesByPath,
    );

    if (childRoutes.length === 0 && childSegments.length === 0) {
      continue; // No children, skip
    }

    // Generate index.ts for this intermediate path
    const filePath = getRouteFilePath(segmentPath, routesDir, ".ts");
    const dirPath = path.dirname(filePath);
    mkdir(dirPath, { recursive: true });

    const indexCode = generateIntermediateIndexFile(
      childRoutes,
      childSegments,
      importPrefix,
    );

    writeFile(filePath, indexCode);
  }
}

/**
 * Finds direct child path segments that need to be imported
 */
function findDirectChildSegments(
  parentPath: string,
  allPathSegments: string[],
  routesByPath: Map<string, RouteInfo[]>,
): string[] {
  const childSegments: string[] = [];
  const parentSegments = parentPath.split("/").filter(Boolean);
  const parentDepth = parentSegments.length;

  for (const segmentPath of allPathSegments) {
    const segments = segmentPath.split("/").filter(Boolean);

    // Child segment should have exactly one more segment than the parent
    if (segments.length === parentDepth + 1) {
      let isChild = true;
      for (let i = 0; i < parentDepth; i++) {
        if (segments[i] !== parentSegments[i]) {
          isChild = false;
          break;
        }
      }

      if (isChild && !routesByPath.has(segmentPath)) {
        childSegments.push(segmentPath);
      }
    }
  }

  return childSegments;
}

/**
 * Converts kebab-case strings to camelCase
 * Example: "change-password" -> "changePassword", "send-code" -> "sendCode"
 */
function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Generates the content for an intermediate index.ts file
 */
function generateIntermediateIndexFile(
  childRoutes: string[],
  childSegments: string[],
  importPrefix: ".js" | ".ts" | false,
): string {
  const imports: string[] = [];
  const exports: string[] = [];
  const processedSegments = new Set<string>(); // Track processed segments to avoid duplicates

  // Helper function to process a path and add it to imports/exports if not already processed
  const processPath = (childPath: string) => {
    const childSegment = childPath.split("/").filter(Boolean).pop()!;
    const isParam = childSegment.startsWith("{") && childSegment.endsWith("}");

    let importName: string;
    let exportName: string;

    if (isParam) {
      // Handle path parameters like {pet-id} -> $petId
      const paramName = childSegment.substring(1, childSegment.length - 1);
      const camelCaseParam = kebabToCamelCase(paramName);
      importName = "$" + camelCaseParam;
      exportName = "$" + camelCaseParam;
    } else {
      // Handle regular segments like change-password -> changePassword
      const camelCaseSegment = kebabToCamelCase(childSegment);
      importName = camelCaseSegment;
      exportName = camelCaseSegment;
    }

    const importPath = isParam
      ? "./$" + childSegment.substring(1, childSegment.length - 1)
      : "./" + childSegment;

    // Skip if we've already processed this segment
    if (processedSegments.has(importName)) {
      return;
    }

    processedSegments.add(importName);

    imports.push(
      `import { routes as ${importName}Routes } from '${importPath}/index${importPrefix ?? ""}';`,
    );
    exports.push(`  ${exportName}: ${importName}Routes,`);
  };

  // Process child routes that have actual endpoints
  for (const childPath of childRoutes) {
    processPath(childPath);
  }

  // Process child segments that are intermediate paths
  for (const childSegmentPath of childSegments) {
    processPath(childSegmentPath);
  }

  return `${imports.join("\n")}

export const routes = {
${exports.join("\n")}
};
`;
}

/**
 * Generates an index.ts file that exports all routes
 */
function generateRoutesIndex(
  routesByPath: Map<string, RouteInfo[]>,
  allPathSegments: string[],
  outputDir: string,
  importPrefix: ".js" | ".ts" | false,
  writeFile: FileWriter,
): void {
  // Generate the index file for top-level routes
  const imports: string[] = [
    // TODO: Uncomment this when alias file generation is fixed
    // `import { aliases } from './alias${importPrefix ?? ""}';`,
  ];
  const exportStatements: string[] = [];
  const routeExports: string[] = [];

  // Find top-level segments (first level after root)
  const topLevelSegments = getTopLevelSegments(routesByPath, allPathSegments);

  for (const segmentPath of topLevelSegments) {
    const segment = segmentPath.split("/").filter(Boolean)[0];
    const exportName = kebabToCamelCase(
      segment.replaceAll("{", "$").replaceAll("}", "").replaceAll("-", "_"),
    ); // Convert underscores first, then kebab-case

    imports.push(
      `import { routes as ${segment.replaceAll("{", "$").replaceAll("}", "").replaceAll("-", "_")}Routes } from './${segment}/index${importPrefix ?? ""}';`,
    );
    exportStatements.push(
      `export const ${exportName} = ${segment.replaceAll("{", "$").replaceAll("}", "").replaceAll("-", "_")}Routes;`,
    );
    routeExports.push(
      `  ${exportName}: ${segment.replaceAll("{", "$").replaceAll("}", "").replaceAll("-", "_")}Routes,`,
    );
  }

  // Add export for the consolidated routes object
  // TODO: Uncomment this when alias file generation is fixed
  //   const consolidatedExport = `
  // // Export a consolidated routes object that can be used as the SDK client
  // export const routes = {
  // ${routeExports.join("\n")}
  //   ...aliases
  // };`;

  const consolidatedExport = `
// Export a consolidated routes object that can be used as the SDK client
export const routes = {
${routeExports.join("\n")}
};`;

  const indexCode = `${imports.join("\n")}\n\n${exportStatements.join("\n")}\n${consolidatedExport}\n`;
  const indexPath = path.join(outputDir, "routes", "index.ts");
  writeFile(indexPath, indexCode);

  // Generate the main SDK index file that exports the client
  const sdkIndexCode = `
// Export the routes object as the SDK client
export { routes as client } from './routes${importPrefix ?? ""}';
`;
  writeFile(path.join(outputDir, "index.ts"), sdkIndexCode);
}

/**
 * Gets the top-level segments that should be exported from the main routes index
 */
function getTopLevelSegments(
  routesByPath: Map<string, RouteInfo[]>,
  allPathSegments: string[],
): string[] {
  const topLevelSet = new Set<string>();

  // Get all first-level segments from actual routes
  for (const routePath of routesByPath.keys()) {
    const segments = routePath.split("/").filter(Boolean);
    if (segments.length > 0) {
      topLevelSet.add("/" + segments[0]);
    }
  }

  // Also include intermediate path segments at the first level
  for (const segmentPath of allPathSegments) {
    const segments = segmentPath.split("/").filter(Boolean);
    if (segments.length === 1) {
      topLevelSet.add(segmentPath);
    }
  }

  return Array.from(topLevelSet).sort();
}

/**
 * Creates a valid variable name from a route path
 */
function getRouteVariableName(routePath: string): string {
  return routePath
    .replaceAll("{", "$")
    .replaceAll("}", "") // Replace {param} with $param
    .replaceAll("-", "_") // Replace - with _
    .split("/")
    .filter(Boolean)
    .join("_")
    .replace(/[^a-zA-Z0-9_$]/g, "_");
}

/**
 * Collects all operationIds and their corresponding routes for alias generation
 */
export function collectOperationIds(
  routes: RouteInfo[],
): Array<{ operationId: string; path: string; method: string }> {
  const operationIds: Array<{
    operationId: string;
    path: string;
    method: string;
  }> = [];

  for (const route of routes) {
    if (route.operationId) {
      operationIds.push({
        operationId: route.operationId,
        path: route.path,
        method: route.method,
      });
    }
  }

  return operationIds;
}

/**
 * Generates the alias.ts file that maps operationIds to their function implementations
 */
export function generateAliasFile(
  routes: RouteInfo[],
  outputDir: string,
  importPrefix: ".js" | ".ts" | false,
  writeFile: FileWriter,
): void {
  const operationIdMappings = collectOperationIds(routes);

  if (operationIdMappings.length === 0) {
    return; // No operationIds to map
  }

  const imports: string[] = [];
  const exports: string[] = [];
  const importedPaths = new Set<string>();

  for (const { operationId, path, method } of operationIdMappings) {
    const routePath = getRouteFilePath(path, "./", importPrefix);

    const routeVarName = getRouteVariableName(path);

    if (!importedPaths.has(routePath)) {
      imports.push(`import * as ${routeVarName} from './${routePath}';`);
      importedPaths.add(routePath);
    }

    exports.push(
      `${operationId}: ${routeVarName}.${method === "delete" ? "del" : method},`,
    );
  }

  const aliasCode = `/**
 * Alias definitions for operationIds
 * This file maps operationId values to their corresponding route functions
 */

${imports.join("\n")}

export const aliases =  {
  ${exports.join("\n  ")}
}
`;

  writeFile(path.join(outputDir, "routes", "alias.ts"), aliasCode);
}

/**
 * Generates the route file content
 */
function generateRouteFile(
  routePath: string,
  routes: RouteInfo[],
  allRoutes: Map<string, RouteInfo[]>,
  importPrefix: ".js" | ".ts" | false,
): string {
  const imports = [];
  const schemaImports = new Set<string>();
  const inlineSchemas: string[] = [];
  const childRouteImports: string[] = [];

  // Add zod import
  imports.push('import { z } from "zod";');

  // Find direct child routes
  const childRoutes = findDirectChildRoutes(routePath, allRoutes);

  // Find schema references in all route methods
  for (const route of routes) {
    // Check request body for schema references
    if (route.requestBody?.content) {
      for (const contentType in route.requestBody.content) {
        const schema = route.requestBody.content[contentType].schema;
        findSchemaRefs(schema).forEach((schemaName) =>
          schemaImports.add(schemaName),
        );
      }
    }

    // Check responses for schema references and inline schemas
    if (route.responses) {
      for (const statusCode in route.responses) {
        const response = route.responses[statusCode];
        if (response.content) {
          for (const contentType in response.content) {
            if (contentType !== "application/json") {
              continue;
            }

            const schema = response.content[contentType].schema;

            // Generate inline schema using generateZodSchema
            const method =
              route.method === "delete" ? "del" : route.method.toLowerCase();
            const schemaName = `${method}ResponseSchema`;
            const { schemaCode, references } = generateZodSchema(schema);

            references.forEach((ref) => schemaImports.add(ref));

            let referencesContainsSelf = false;

            references.forEach((ref) => {
              referencesContainsSelf =
                referencesContainsSelf || schemaCode === `${ref}Schema`;
            });

            if (referencesContainsSelf) continue;

            inlineSchemas.push(`const ${schemaName} = ${schemaCode};`);
          }
        }
      }
    }

    // Check parameters for schema references
    if (route.parameters) {
      for (const param of route.parameters) {
        if (param.schema && "$ref" in param.schema) {
          const schemaName = param.schema.$ref.replace(
            "#/components/schemas/",
            "",
          );
          schemaImports.add(schemaName);
        }
      }
    }
  }

  // Trim trailing slash
  if (routePath.endsWith("/")) {
    routePath = routePath.slice(0, -1);
  }

  // Calculate the number of `../` to use for the relative import path
  const relativeImportDepthFromRoot = Array(routePath.split("/").length)
    .fill("..")
    .join("/");

  // Add schema imports
  if (schemaImports.size > 0) {
    imports.push(
      `import { ${Array.from(schemaImports)
        .map((s) => `${s}, ${s}Schema`)
        .join(
          ", ",
        )} } from "${relativeImportDepthFromRoot}/schemas/index${importPrefix ?? ""}";`,
    );
  }

  // Add the SDK configuration import
  imports.push(
    `import { sdkConfig } from "${relativeImportDepthFromRoot}/config${importPrefix ?? ""}";`,
  );

  // Process child routes imports
  for (const childPath of childRoutes) {
    const childSegment = childPath.split("/").filter(Boolean).pop()!;
    const isParam = childSegment.startsWith("{") && childSegment.endsWith("}");

    let importName: string;

    if (isParam) {
      // Handle path parameters like {pet-id} -> $petId
      const paramName = childSegment.substring(1, childSegment.length - 1);
      const camelCaseParam = kebabToCamelCase(paramName);
      importName = "$" + camelCaseParam;
    } else {
      // Handle regular segments like change-password -> changePassword
      importName = kebabToCamelCase(childSegment);
    }

    const importPath = isParam
      ? "./$" + childSegment.substring(1, childSegment.length - 1)
      : "./" + childSegment;

    childRouteImports.push(
      `import { routes as ${importName}Routes } from '${importPath}/index${importPrefix ?? ""}';`,
    );
  }

  // Generate each HTTP method function
  const functions: string[] = [];
  const routeMethodExports: string[] = [];

  for (const route of routes) {
    const functionName =
      route.method === "delete" ? "del" : route.method.toLowerCase();
    const functionCode = generateRouteFunction(route, routePath, functionName);
    functions.push(functionCode);
    routeMethodExports.push(`  ${functionName},`);
  }

  // Generate child route exports
  const childRouteExports: string[] = [];
  for (const childPath of childRoutes) {
    const childSegment = childPath.split("/").filter(Boolean).pop()!;
    const isParam = childSegment.startsWith("{") && childSegment.endsWith("}");

    let importName: string;
    let exportName: string;

    if (isParam) {
      // Handle path parameters like {pet-id} -> $petId
      const paramName = childSegment.substring(1, childSegment.length - 1);
      const camelCaseParam = kebabToCamelCase(paramName);
      importName = "$" + camelCaseParam;
      exportName = "$" + camelCaseParam;
    } else {
      // Handle regular segments like change-password -> changePassword
      const camelCaseSegment = kebabToCamelCase(childSegment);
      importName = camelCaseSegment;
      exportName = camelCaseSegment;
    }

    childRouteExports.push(`  ${exportName}: ${importName}Routes,`);
  }

  // Generate the routes dictionary
  const routesDict = `export const routes = {
${childRouteExports.join("\n")}
${routeMethodExports.join("\n")}
};`;

  // Compile the full file content
  return `${imports.join("\n")}
${childRouteImports.length > 0 ? "\n" + childRouteImports.join("\n") : ""}
${inlineSchemas.length > 0 ? "\n" + inlineSchemas.join("\n") : ""}
${functions.join("\n\n")}

${routesDict}
`;
}

/**
 * Generates a function for a specific route and HTTP method
 */
function generateRouteFunction(
  route: RouteInfo,
  routePath: string,
  functionName: string,
): string {
  const method = route.method.toUpperCase();

  // Collect path parameters
  const pathParams = (route.parameters || []).filter((p) => p.in === "path");

  // Collect query parameters
  const queryParams = (route.parameters || []).filter((p) => p.in === "query");

  // Determine if there's a request body
  const hasRequestBody = !!route.requestBody;
  const requestBodyRequired = route.requestBody?.required ?? false;

  // Build function parameter types
  const paramTypes: string[] = [];

  // Add path parameters
  if (pathParams.length > 0) {
    const pathParamsType = `pathParams: {\n${pathParams
      .map((p) => `    ${p.name}: ${getTypeForParameter(p)}`)
      .join(",\n")}\n  }`;
    paramTypes.push(pathParamsType);
  }

  // Add query parameters
  if (queryParams.length > 0) {
    const queryParamsType = `queryParams${queryParams.every((p) => !p.required) ? "?" : ""}: {\n${queryParams
      .map(
        (p) =>
          `    ${p.name}${p.required ? "" : "?"}: ${getTypeForParameter(p)}`,
      )
      .join(",\n")}\n  }`;
    paramTypes.push(queryParamsType);
  }

  // Add request body if needed
  if (hasRequestBody) {
    const bodyType = getBodyType(route);
    paramTypes.push(`body${requestBodyRequired ? "" : "?"}: ${bodyType}`);
  }

  // Add headers parameter
  paramTypes.push("headers?: Record<string, string>");

  // Get response type
  const responseType = getResponseType(route);

  // Build function body
  const functionBody = buildFunctionBody(
    route,
    routePath,
    pathParams,
    queryParams,
    hasRequestBody,
    responseType,
  );

  // Add comment with operationId if it exists
  const operationIdComment = route.operationId
    ? `\n * OperationId: ${route.operationId}`
    : "";

  // Compile the full function
  return `/**
 * ${route.summary || `${method} ${routePath}`}
 * ${route.description || ""}${operationIdComment}
 */
export async function ${functionName}(${paramTypes.join(", ")}): Promise<${responseType}> {
${functionBody}
}`;
}

/**
 * Determines the TypeScript type for a parameter
 */
function getTypeForParameter(param: any): string {
  if (param.schema?.$ref) {
    const refName = param.schema.$ref.replace("#/components/schemas/", "");
    return refName;
  }

  if (param.schema?.type === "array") {
    if (param.schema.items?.$ref) {
      const itemRefName = param.schema.items.$ref.replace(
        "#/components/schemas/",
        "",
      );
      return `${itemRefName}[]`;
    }
    return `${getTypeForSchema(param.schema.items)}[]`;
  }

  return getTypeForSchema(param.schema);
}

/**
 * Gets the TypeScript type for a schema
 */
function getTypeForSchema(schema: SchemaObject): string {
  if (!schema) return "any";

  if ("$ref" in schema) return schema.$ref.replace("#/components/schemas/", "");

  if ("allOf" in schema) {
    return `z.intersection([${schema.allOf.map((s) => getTypeForSchema(s)).join(", ")}])`;
  }

  if ("oneOf" in schema) {
    return `z.union([${schema.oneOf.map((s) => getTypeForSchema(s)).join(", ")}])`;
  }

  if ("anyOf" in schema) {
    return `z.union([${schema.anyOf.map((s) => getTypeForSchema(s)).join(", ")}])`;
  }

  switch (schema.type) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object":
      return "Record<string, any>";
    case "array":
      return `Array<${schema.items ? getTypeForSchema(schema.items) : "any"}>`;
    default:
      return "any";
  }
}

/**
 * Gets the request body type
 */
function getBodyType(route: RouteInfo): string {
  if (!route.requestBody?.content) {
    return "any";
  }

  // Check for JSON content
  const jsonContent = route.requestBody.content["application/json"];
  if (jsonContent?.schema) {
    return getTypeForSchema(jsonContent.schema);
  }

  return "any";
}

/**
 * Gets the response type
 */
function getResponseType(route: RouteInfo): string {
  if (!route.responses) {
    return "any";
  }

  // Check for 200 or 201 responses
  const successResponse = route.responses["200"] || route.responses["201"];
  if (successResponse?.content) {
    const jsonContent = successResponse.content["application/json"];
    if (jsonContent?.schema) {
      if ("$ref" in jsonContent.schema) {
        const refName = jsonContent.schema.$ref.replace(
          "#/components/schemas/",
          "",
        );
        return refName;
      }
      // For inline schemas, use z.infer with the generated schema
      const method =
        route.method === "delete" ? "del" : route.method.toLowerCase();
      return `z.infer<typeof ${method}ResponseSchema>`;
    }
  }

  return "void";
}

/**
 * Builds the function implementation
 */
function buildFunctionBody(
  route: RouteInfo,
  routePath: string,
  pathParams: any[],
  queryParams: any[],
  hasRequestBody: boolean,
  responseType: string,
): string {
  const urlParts: string[] = [];

  // Build the URL with path parameters
  urlParts.push("  // Construct the URL with path parameters");
  if (pathParams.length > 0) {
    urlParts.push(
      `  let url = \`\${sdkConfig.baseUrl}${routePath.replace(/{([^}]+)}/g, "${pathParams.$1}")}\`;`,
    );
  } else {
    urlParts.push(`  let url = \`\${sdkConfig.baseUrl}${routePath}\`;`);
  }

  // Add query parameters if needed
  if (queryParams.length > 0) {
    urlParts.push("\n  // Add query parameters");
    urlParts.push("  if (queryParams) {");
    urlParts.push("    const searchParams = new URLSearchParams();");
    urlParts.push(
      "    " +
        queryParams
          .map((p) => {
            return `if (queryParams.${p.name} !== undefined) searchParams.append('${p.name}', String(queryParams.${p.name}));`;
          })
          .join("\n    "),
    );
    urlParts.push("    const queryString = searchParams.toString();");
    urlParts.push("    if (queryString) {");
    urlParts.push("      url += `?${queryString}`;");
    urlParts.push("    }");
    urlParts.push("  }");
  }

  // Prepare fetch options
  const fetchParts: string[] = [];
  fetchParts.push("\n  // Prepare fetch options");
  fetchParts.push("  const options: RequestInit = {");
  fetchParts.push(`    method: '${route.method.toUpperCase()}',`);
  fetchParts.push("    headers: {");
  fetchParts.push("      'Content-Type': 'application/json',");
  fetchParts.push("      ...sdkConfig.headers,");
  fetchParts.push("      ...headers,");
  fetchParts.push("    },");

  // Add body if needed
  if (hasRequestBody) {
    fetchParts.push("    ...(body && { body: JSON.stringify(body) }),");
  }

  fetchParts.push("  };");

  // Perform the fetch request
  const responseParts: string[] = [];
  responseParts.push("\n  // Make the request");
  responseParts.push("  const response = await fetch(url, options);");
  responseParts.push("\n  // Handle the response");
  responseParts.push("  if (!response.ok) {");
  responseParts.push(
    "    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);",
  );
  responseParts.push("  }");
  responseParts.push("\n  // Parse the response");
  responseParts.push("  const data = await response.json();");

  if (responseType.startsWith("Array<")) {
    const arrayItemType = responseType.replace("Array<", "").replace(">", "");
    responseParts.push("\n  // Parse the response");
    responseParts.push(`  const list: ${responseType} = [];`);
    responseParts.push("  for (const item of data) {");
    responseParts.push(`    list.push(${arrayItemType}Schema.parse(item));`);
    responseParts.push("  }");
    responseParts.push("\n  // return List;");
    responseParts.push("  return list;");
  } else if (responseType === "any") {
    responseParts.push(`  return data;`);
  } else if (responseType === "void") {
    responseParts.pop(); // Remove `const data = await response.json();` from the responseParts array
    responseParts.push("  return;");
  } else if (responseType.startsWith("z.infer<")) {
    // Handle inline schema validation
    const method =
      route.method === "delete" ? "del" : route.method.toLowerCase();
    responseParts.push(`  return ${method}ResponseSchema.parse(data);`);
  } else {
    responseParts.push(`  return ${responseType}Schema.parse(data);`);
  }

  return [...urlParts, ...fetchParts, ...responseParts].join("\n");
}
