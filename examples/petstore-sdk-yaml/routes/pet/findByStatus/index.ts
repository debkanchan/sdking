import { z } from "zod";
import { Pet, PetSchema } from "../../../schemas/index.js";
import { sdkConfig } from "../../../config.js";

const getResponseSchema = z.array(PetSchema);
/**
 * Finds Pets by status.
 * Multiple status values can be provided with comma separated strings.
 * OperationId: findPetsByStatus
 */
export async function get(
  queryParams?: {
    status?: string;
  },
  headers?: Record<string, string>,
): Promise<z.infer<typeof getResponseSchema>> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/pet/findByStatus`;

  // Add query parameters
  if (queryParams) {
    const searchParams = new URLSearchParams();
    if (queryParams.status !== undefined)
      searchParams.append("status", String(queryParams.status));
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
