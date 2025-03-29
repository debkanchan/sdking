/**
 * SDK Configuration
 * Generated from Swagger Petstore - OpenAPI 3.0 v1.0.26
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
   * Default API server from OpenAPI spec: /api/v3
   * Change this to your API server URL
   */
  baseUrl: '/api/v3',
  
  /**
   * Default headers sent with each request
   */
  headers: {
    'Accept': 'application/json',
  },
};
