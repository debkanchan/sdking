import fs from 'fs';
import yaml from 'js-yaml';
import { OpenAPISpec } from './types.js';
import path from 'path';

/**
 * Loads and parses an OpenAPI spec from a file path or URL
 */
export async function parseOpenAPISpec(inputPath: string): Promise<OpenAPISpec> {
  let content: string;
  
  if (inputPath.startsWith('http://') || inputPath.startsWith('https://')) {
    // Load from URL
    const response = await fetch(inputPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI spec from ${inputPath}: ${response.statusText}`);
    }
    content = await response.text();
  } else {
    // Load from file system
    const resolvedPath = inputPath.startsWith('/') 
      ? inputPath 
      : path.resolve(process.cwd(), inputPath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`OpenAPI spec file not found: ${resolvedPath}`);
    }
    
    content = fs.readFileSync(resolvedPath, 'utf8');
  }

  // Parse based on file extension
  try {
    let spec: any;
    const isJSON = inputPath.toLowerCase().endsWith('.json');
    
    if (isJSON) {
      spec = JSON.parse(content);
    } else {
      spec = yaml.load(content);
    }
    
    validateOpenAPISpec(spec);
    return spec as OpenAPISpec;
  } catch (error) {
    throw new Error(`Failed to parse OpenAPI spec: ${(error as Error).message}`);
  }
}

/**
 * Validates that the parsed content is a valid OpenAPI spec
 */
function validateOpenAPISpec(spec: any): asserts spec is OpenAPISpec {
  if (!spec) {
    throw new Error('OpenAPI spec is empty');
  }
  
  if (!spec.openapi) {
    throw new Error('Missing "openapi" field');
  }
  
  if (!spec.info) {
    throw new Error('Missing "info" field');
  }
  
  if (!spec.paths) {
    throw new Error('Missing "paths" field');
  }
} 