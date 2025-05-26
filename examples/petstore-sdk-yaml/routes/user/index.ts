import { z } from "zod";
import { type User, UserSchema } from "../../schemas/index.js";
import { sdkConfig } from "../../config.js";

import { routes as createWithListRoutes } from "./createWithList/index.js";
import { routes as loginRoutes } from "./login/index.js";
import { routes as logoutRoutes } from "./logout/index.js";
import { routes as $usernameRoutes } from "./$username/index.js";

/**
 * Create user.
 * This can only be done by the logged in user.
 * OperationId: createUser
 */
export async function post(
  body?: User,
  headers?: Record<string, string>,
): Promise<User> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/user`;

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
  createWithList: createWithListRoutes,
  login: loginRoutes,
  logout: logoutRoutes,
  $username: $usernameRoutes,
  post,
};
