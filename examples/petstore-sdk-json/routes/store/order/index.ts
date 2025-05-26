import { z } from "zod";
import { type Order, OrderSchema } from "../../../schemas/index.js";
import { sdkConfig } from "../../../config.js";

import { routes as $orderIdRoutes } from "./$orderId/index.js";

/**
 * Place an order for a pet.
 * Place a new order in the store.
 * OperationId: placeOrder
 */
export async function post(
  body?: Order,
  headers?: Record<string, string>,
): Promise<Order> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/store/order`;

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
  return OrderSchema.parse(data);
}

export const routes = {
  $orderId: $orderIdRoutes,
  post,
};
