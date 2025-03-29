import { z } from "zod";
import { sdkConfig } from "../../../config.js";


const getResponseSchema = z.object({

}).catchall(z.number());
/**
 * Returns pet inventories by status.
 * Returns a map of status codes to quantities.
 * OperationId: getInventory
 */
export async function get(headers?: Record<string, string>): Promise<z.infer<typeof getResponseSchema>> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/store/inventory`;

  // Prepare fetch options
  const options: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...sdkConfig.headers,
      ...headers,
    },
  };

  // Make the request
  const response = await fetch(url, options);

  // Handle the response
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }

  // Parse the response
  const data = await response.json();
  return getResponseSchema.parse(data);
}

export const routes = {

  get,
};
