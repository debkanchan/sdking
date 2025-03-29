import { z } from "zod";
import { Order, OrderSchema } from "../../../../schemas/index.js";
import { sdkConfig } from "../../../../config.js";

/**
 * Find purchase order by ID.
 * For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * OperationId: getOrderById
 */
export async function get(
  pathParams: {
    orderId: number;
  },
  headers?: Record<string, string>,
): Promise<Order> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/store/order/${pathParams.orderId}`;

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
  return OrderSchema.parse(data);
}

/**
 * Delete purchase order by identifier.
 * For valid response try integer IDs with value < 1000. Anything above 1000 or non-integers will generate API errors.
 * OperationId: deleteOrder
 */
export async function del(
  pathParams: {
    orderId: number;
  },
  headers?: Record<string, string>,
): Promise<void> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/store/order/${pathParams.orderId}`;

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
  del,
};
