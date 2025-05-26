import { z } from "zod";
import { type Pet, PetSchema } from "../../../schemas/index.js";
import { sdkConfig } from "../../../config.js";

const getResponseSchema = z.array(PetSchema);
/**
 * Finds Pets by tags.
 * Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * OperationId: findPetsByTags
 */
export async function get(
  queryParams?: {
    tags?: string[];
  },
  headers?: Record<string, string>,
): Promise<z.infer<typeof getResponseSchema>> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/pet/findByTags`;

  // Add query parameters
  if (queryParams) {
    const searchParams = new URLSearchParams();
    if (queryParams.tags !== undefined)
      searchParams.append("tags", String(queryParams.tags));
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
