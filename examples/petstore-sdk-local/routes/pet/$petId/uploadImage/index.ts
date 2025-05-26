import { z } from "zod";
import {
  type ApiResponse,
  ApiResponseSchema,
} from "../../../../schemas/index.js";
import { sdkConfig } from "../../../../config.js";

/**
 * Uploads an image.
 * Upload image of the pet.
 * OperationId: uploadFile
 */
export async function post(
  pathParams: {
    petId: number;
  },
  queryParams?: {
    additionalMetadata?: string;
  },
  body?: any,
  headers?: Record<string, string>,
): Promise<ApiResponse> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/pet/${pathParams.petId}/uploadImage`;

  // Add query parameters
  if (queryParams) {
    const searchParams = new URLSearchParams();
    if (queryParams.additionalMetadata !== undefined)
      searchParams.append(
        "additionalMetadata",
        String(queryParams.additionalMetadata),
      );
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

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
  return ApiResponseSchema.parse(data);
}

export const routes = {
  post,
};
