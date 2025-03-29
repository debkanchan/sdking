import { OpenAPISpec } from './types.js';
import path from 'path';
import { FileWriter } from '../utils/fs.js';

/**
 * Generates the SDK configuration file
 */
export function generateConfigFile(spec: OpenAPISpec, outputDir: string, writeFile: FileWriter): void {
  // Determine default server URL from the spec
  const defaultServer = spec.servers && spec.servers.length > 0 
    ? spec.servers[0].url 
    : 'http://localhost';
  
  const configCode = `/**
 * SDK Configuration
 * Generated from ${spec.info.title} v${spec.info.version}
 */

/**
 * SDK Configuration interface
 */
export interface SDKConfig {
  /**
   * Base URL for API requests
   * Can be overridden per-request by the user
   */
  baseUrl: string;
  
  /**
   * Default headers sent with each request
   */
  headers: Record<string, string>;
}

/**
 * Default SDK configuration
 * This can be modified by the user after importing the SDK
 */
export const sdkConfig: SDKConfig = {
  /**
   * Default API server from OpenAPI spec: ${defaultServer}
   * Change this to your API server URL
   */
  baseUrl: '${defaultServer}',
  
  /**
   * Default headers sent with each request
   */
  headers: {
    'Accept': 'application/json',
  },
};
`;

  // Write the configuration file
  writeFile(path.join(outputDir, 'config.ts'), configCode);
}

/**
 * Generates the SDK index file
 */
export function generateIndexFile(outputDir: string, importPrefix: ".js" | ".ts" | false, writeFile: FileWriter): void {
  const indexCode = `/**
 * OpenAPI SDK
 * Generated with SDKing
 */

export * from './config${importPrefix ?? ''}';
export * from './schemas/index${importPrefix ?? ''}';
export { routes as client } from './routes/index${importPrefix ?? ''}';
`;

  // Write the index file
  writeFile(path.join(outputDir, 'index.ts'), indexCode);
} 