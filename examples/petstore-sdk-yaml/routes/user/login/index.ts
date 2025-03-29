import { z } from "zod";
import { sdkConfig } from "../../../config.js";

const getResponseSchema = z.string();
/**
 * Logs user into the system.
 * Log into the system.
 * OperationId: loginUser
 */
export async function get(
  queryParams?: {
    username?: string;
    password?: string;
  },
  headers?: Record<string, string>,
): Promise<z.infer<typeof getResponseSchema>> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/user/login`;

  // Add query parameters
  if (queryParams) {
    const searchParams = new URLSearchParams();
    if (queryParams.username !== undefined)
      searchParams.append("username", String(queryParams.username));
    if (queryParams.password !== undefined)
      searchParams.append("password", String(queryParams.password));
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Prepare fetch options
  const options: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
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
