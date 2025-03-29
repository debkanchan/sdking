import { z } from "zod";
import { sdkConfig } from "../../../config.js";


/**
 * Logs out current logged in user session.
 * Log user out of the system.
 * OperationId: logoutUser
 */
export async function get(headers?: Record<string, string>): Promise<void> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/user/logout`;

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
  return;
}

export const routes = {

  get,
};
