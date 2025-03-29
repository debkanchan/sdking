import { SchemaInfo, SchemaObject, OpenAPISpec } from "./types.js";
import path from "path";
import { DirMaker, FileWriter } from "../utils/fs.js";

/**
 * Extracts and processes all schemas from an OpenAPI spec
 */
export function extractSchemas(spec: OpenAPISpec): SchemaInfo[] {
  const schemas: SchemaInfo[] = [];

  if (!spec.components?.schemas) {
    return schemas;
  }

  // Process each schema in the components section
  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    schemas.push({
      name,
      schema,
      path: name.toLowerCase(), // Simple lowercase conversion for file paths
    });
  }

  return schemas;
}

/**
 * Generates Zod schema files from extracted schemas
 */
export function generateSchemaFiles(
  schemas: SchemaInfo[],
  outputDir: string,
  importPrefix: ".js" | ".ts" | false,
  writeFile: FileWriter,
  mkdir: DirMaker,
): void {
  // Create schemas directory
  const schemasDir = path.join(outputDir, "schemas");
  mkdir(schemasDir, { recursive: true });

  // Generate a file for each schema
  for (const schemaInfo of schemas) {
    // Generate the schema file
    const schemaCode = generateSchemaFile(
      schemaInfo.name,
      schemaInfo.schema,
      importPrefix,
    );
    const filePath = path.join(schemasDir, `${schemaInfo.path}.ts`);
    writeFile(filePath, schemaCode);
  }

  // Generate an index file to export all schemas
  generateSchemasIndex(schemas, outputDir, importPrefix, writeFile);
}

/**
 * Generates an index.ts file that exports all schemas
 */
function generateSchemasIndex(
  schemas: SchemaInfo[],
  outputDir: string,
  importPrefix: ".js" | ".ts" | false,
  writeFile: FileWriter,
): void {
  const exports: string[] = [];

  for (const schema of schemas) {
    const importPath = `./${schema.path}`;
    exports.push(`export * from '${importPath}${importPrefix ?? ""}';`);
  }

  const indexCode = `${exports.join("\n")}\n`;
  const indexPath = path.join(outputDir, "schemas", "index.ts");
  writeFile(indexPath, indexCode);
}

/**
 * Generates a Zod schema from an OpenAPI schema
 */
export function generateSchemaFile(
  name: string,
  schema: SchemaObject,
  importPrefix: ".js" | ".ts" | false,
): string {
  const imports = ['import { z } from "zod";'];
  // const schemaRefs = findSchemaRefs(schema);

  const { schemaCode, references } = generateZodSchema(schema);

  // Add imports for referenced schemas
  for (const ref of references) {
    imports.push(
      `import { ${ref}Schema } from "./${ref.toLowerCase()}${importPrefix ?? ""}";`,
    );
  }

  let schemaFileCode = `${imports.join("\n")}

export const ${name}Schema = ${schemaCode};

export type ${name} = z.infer<typeof ${name}Schema>;
`;

  return schemaFileCode;
}

/**
 * Finds all schema references in a schema object
 */
export function findSchemaRefs(schema: SchemaObject): string[] {
  const refs: Set<string> = new Set();

  function traverse(obj: SchemaObject): void {
    if ("$ref" in obj) {
      const refName = obj.$ref.replace("#/components/schemas/", "");
      refs.add(refName);
      return;
    }

    if (obj.type === "allOf" && obj.allOf) {
      obj.allOf.forEach(traverse);
    }

    if (obj.type === "oneOf" && obj.oneOf) {
      obj.oneOf.forEach(traverse);
    }

    if (obj.type === "anyOf" && obj.anyOf) {
      obj.anyOf.forEach(traverse);
    }

    if (obj.type == "array" && obj.items) {
      traverse(obj.items);
    }

    if (obj.type == "object" && obj.properties) {
      Object.values(obj.properties).forEach(traverse);

      if (
        obj.additionalProperties &&
        typeof obj.additionalProperties !== "boolean"
      ) {
        traverse(obj.additionalProperties);
      }
    }
  }

  traverse(schema);
  return Array.from(refs);
}

/**
 * Converts an OpenAPI schema to a Zod schema
 */
export function generateZodSchema(schema: SchemaObject): {
  schemaCode: string;
  references: string[];
} {
  if ("$ref" in schema) {
    const refName = schema.$ref.replace("#/components/schemas/", "");
    return { schemaCode: `${refName}Schema`, references: [refName] };
  }

  if (schema.type === "object") {
    // Handle object type
    const properties = schema.properties || {};
    const required = schema.required || [];

    const references = new Set<string>();

    const propEntries = Object.entries(properties).map(
      ([propName, propSchema]) => {
        const { schemaCode: propZod, references: refs } =
          generateZodSchema(propSchema);
        const isRequired = required.includes(propName);

        refs.forEach((ref) => references.add(ref));
        return `  ${propName}: ${propZod}${!isRequired ? ".optional()" : ""}`;
      },
    );

    let catchAllProp = "";

    if (schema.additionalProperties === true) {
      catchAllProp = ".catchall(z.any())";
    } else if (schema.additionalProperties) {
      const { schemaCode: additionalPropertiesZod, references: refs } =
        generateZodSchema(schema.additionalProperties);
      catchAllProp = `.catchall(${additionalPropertiesZod})`;

      refs.forEach((ref) => references.add(ref));
    }

    return {
      schemaCode: `z.object({\n${propEntries.join(",\n")}\n})${!!catchAllProp ? catchAllProp : ""}${schema.nullable ? ".nullable()" : ""}`,
      references: Array.from(references),
    };
  }

  if (schema.type === "array") {
    // Handle array type
    const { schemaCode: itemsZod, references } = schema.items
      ? generateZodSchema(schema.items)
      : { schemaCode: "z.any()", references: [] };
    return {
      schemaCode: `z.array(${itemsZod})${schema.nullable ? ".nullable()" : ""}`,
      references,
    };
  }

  if (schema.type === "enum") {
    // Handle enum type
    const enumValues = schema.enum.map((value) =>
      typeof value === "string" ? `"${value}"` : value,
    );
    return {
      schemaCode: `z.enum([${enumValues.join(", ")}])${schema.nullable ? ".nullable()" : ""}`,
      references: [],
    };
  }

  if (schema.type === "allOf") {
    // Handle allOf (intersection)
    const allOfZod = schema.allOf.map((s) => generateZodSchema(s));

    const references = new Set<string>();
    const intersectionSchemas: string[] = [];

    allOfZod.forEach((item) => {
      item.references.forEach((ref) => references.add(ref));
      intersectionSchemas.push(item.schemaCode);
    });

    return {
      schemaCode: `z.intersection([${intersectionSchemas.join(", ")}])${schema.nullable ? ".nullable()" : ""}`,
      references: Array.from(references),
    };
  }

  if (schema.type === "oneOf") {
    // Handle oneOf (union)
    const oneOfZod = schema.oneOf.map((s) => generateZodSchema(s));

    const references = new Set<string>();
    const oneOfSchemas: string[] = [];

    oneOfZod.forEach((item) => {
      item.references.forEach((ref) => references.add(ref));
      oneOfSchemas.push(item.schemaCode);
    });

    return {
      schemaCode: `z.union([${oneOfSchemas.join(", ")}])${schema.nullable ? ".nullable()" : ""}`,
      references: Array.from(references),
    };
  }

  if (schema.type === "anyOf") {
    // Handle anyOf (union)
    const anyOfZod = schema.anyOf.map((s) => generateZodSchema(s));

    const references = new Set<string>();
    const anyOfSchemas: string[] = [];

    anyOfZod.forEach((item) => {
      item.references.forEach((ref) => references.add(ref));
      anyOfSchemas.push(item.schemaCode);
    });

    return {
      schemaCode: `z.union([${anyOfZod.join(", ")}])${schema.nullable ? ".nullable()" : ""}`,
      references: Array.from(references),
    };
  }

  // Handle primitive types
  switch (schema.type) {
    case "string":
      let stringSchema = "z.string()";

      if (schema.format === "date-time" || schema.format === "date") {
        stringSchema = "z.string().datetime()";
      } else if (schema.format === "email") {
        stringSchema = "z.string().email()";
      } else if (schema.format === "uri") {
        stringSchema = "z.string().url()";
      }

      return {
        schemaCode: `${stringSchema}${schema.nullable ? ".nullable()" : ""}`,
        references: [],
      };

    case "number":
    case "integer":
      return {
        schemaCode: `z.number()${schema.nullable ? ".nullable()" : ""}`,
        references: [],
      };

    case "boolean":
      return {
        schemaCode: `z.boolean()${schema.nullable ? ".nullable()" : ""}`,
        references: [],
      };

    // default:
    //   return {schemaCode: `z.any()${schema.nullable ? '.nullable()' : ''}`, references: []};
  }
}
