export interface GeneratorOptions {
  inputPath: string;
  outputDir: string;
  importPrefix: ".js" | ".ts" | false;
  verbose?: boolean;
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    summary?: string;
    description?: string;
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  servers?: Array<{
    url: string;
    description?: string;
    variables?: Record<string, ServerVariable>;
  }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
}

export interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

interface BasePathItem {
  summary?: string;
  description?: string;
  parameters?: Array<ParameterObject>;
}

interface GetPathItem extends BasePathItem {
  get: OperationObject;
}

interface PutPathItem extends BasePathItem {
  put: OperationObject;
}

interface PostPathItem extends BasePathItem {
  post: OperationObject;
}

interface DeletePathItem extends BasePathItem {
  delete: OperationObject;
}

interface OptionsPathItem extends BasePathItem {
  options: OperationObject;
}

interface HeadPathItem extends BasePathItem {
  head: OperationObject;
}

interface PatchPathItem extends BasePathItem {
  patch: OperationObject;
}

interface TracePathItem extends BasePathItem {
  trace: OperationObject;
}

export type PathItem =
  | GetPathItem
  | PutPathItem
  | PostPathItem
  | DeletePathItem
  | OptionsPathItem
  | HeadPathItem
  | PatchPathItem
  | TracePathItem;

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Array<ParameterObject>;
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
  deprecated?: boolean;
}

export interface ParameterObject {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  description?: string;
  required?: boolean;
  schema?: SchemaObject;
}

export interface RequestBodyObject {
  description?: string;
  content: Record<string, { schema: SchemaObject }>;
  required?: boolean;
}

export interface ResponseObject {
  description: string;
  content?: Record<string, { schema: SchemaObject }>;
}

interface BaseSchema<T> {
  type: string;
  description?: string;
  nullable?: boolean;
  default?: T;
  example?: T;
}

interface StringSchema extends BaseSchema<String> {
  type: "string";
  format?:
    | "date"
    | "date-time"
    | "time"
    | "duration"
    | "email"
    | "idn-email"
    | "hostname"
    | "idn-hostname"
    | "ipv4"
    | "ipv6"
    | "uri"
    | "uri-reference"
    | "iri"
    | "iri-reference"
    | "uuid"
    | "json-pointer"
    | "relative-json-pointer"
    | "regex";
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  contentEncoding?: string;
  contentMediaType?: string;
}

interface NumberSchema extends BaseSchema<number> {
  type: "number";
  format?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
}

interface IntegerSchema extends BaseSchema<number> {
  type: "integer";
  format?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
}

interface BooleanSchema extends BaseSchema<boolean> {
  type: "boolean";
}

interface RefSchema {
  $ref: string;
}

interface AnyOfSchema<T> extends BaseSchema<T> {
  anyOf: T[];
}

interface OneOfSchema<T> extends BaseSchema<T> {
  oneOf: T[];
}

interface AllOfSchema<T> extends BaseSchema<T> {
  allOf: T[];
}

interface EnumSchema<T> extends BaseSchema<T> {
  type: "enum";
  enum: T[];
}

interface ArraySchema<T> extends BaseSchema<T[]> {
  type: "array";
  items: T;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxContains?: number;
  minContains?: number;
}

interface ObjectSchema<T> extends BaseSchema<T> {
  type: "object";
  properties?: Record<string, T>;
  required?: string[];
  maxProperties?: number;
  minProperties?: number;
  additionalProperties?: boolean | T;
}

export type SchemaObject =
  | StringSchema
  | NumberSchema
  | IntegerSchema
  | BooleanSchema
  | RefSchema
  | ArraySchema<SchemaObject>
  | ObjectSchema<SchemaObject>
  | EnumSchema<SchemaObject>
  | AnyOfSchema<SchemaObject>
  | OneOfSchema<SchemaObject>
  | AllOfSchema<SchemaObject>;

// export interface SchemaObject  {
//   type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
//   format?: string;
//   $ref?: string;
//   items?: SchemaObject;
//   properties?: Record<string, SchemaObject>;
//   required?: string[];
//   enum?: any[];
//   allOf?: SchemaObject[];
//   oneOf?: SchemaObject[];
//   anyOf?: SchemaObject[];
//   description?: string;
//   nullable?: boolean;
//   default?: any;
//   example?: any;
//   additionalProperties?: boolean | SchemaObject;
// }

export interface RouteInfo {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Array<ParameterObject>;
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
}

export interface SchemaInfo {
  name: string;
  schema: SchemaObject;
  path: string;
}

export interface GeneratedSDK {
  schemas: SchemaInfo[];
  routes: RouteInfo[];
}
