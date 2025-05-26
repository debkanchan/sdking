import { z } from "zod";
import { type User, UserSchema } from "../../../schemas/index.js";
import { sdkConfig } from "../../../config.js";

/**
 * Creates list of users with given input array.
 * Creates list of users with given input array.
 * OperationId: createUsersWithListInput
 */
export async function post(
  body?: Array<User>,
  headers?: Record<string, string>,
): Promise<User> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/user/createWithList`;

  // Prepare fetch options
  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...sdkConfig.headers,
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  };

  // Make the request
  const response = await fetch(url, options);

  // Handle the response
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }

  // Parse the response
  const data = await response.json();
  return UserSchema.parse(data);
}

export const routes = {
  post,
};
