import { z } from "zod";
import { type User, UserSchema } from "../../../schemas/index.js";
import { sdkConfig } from "../../../config.js";

/**
 * Get user by user name.
 * Get user detail based on username.
 * OperationId: getUserByName
 */
export async function get(
  pathParams: {
    username: string;
  },
  headers?: Record<string, string>,
): Promise<User> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/user/${pathParams.username}`;

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
  return UserSchema.parse(data);
}

/**
 * Update user resource.
 * This can only be done by the logged in user.
 * OperationId: updateUser
 */
export async function put(
  pathParams: {
    username: string;
  },
  body?: User,
  headers?: Record<string, string>,
): Promise<void> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/user/${pathParams.username}`;

  // Prepare fetch options
  const options: RequestInit = {
    method: "PUT",
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
  return;
}

/**
 * Delete user resource.
 * This can only be done by the logged in user.
 * OperationId: deleteUser
 */
export async function del(
  pathParams: {
    username: string;
  },
  headers?: Record<string, string>,
): Promise<void> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/user/${pathParams.username}`;

  // Prepare fetch options
  const options: RequestInit = {
    method: "DELETE",
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
  return;
}

export const routes = {
  get,
  put,
  del,
};
