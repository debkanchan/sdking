import { z } from "zod";
import { Pet, PetSchema } from "../../../schemas/index.js";
import { sdkConfig } from "../../../config.js";

import { routes as uploadImageRoutes } from "./uploadImage/index.js";

/**
 * Find pet by ID.
 * Returns a single pet.
 * OperationId: getPetById
 */
export async function get(
  pathParams: {
    petId: number;
  },
  headers?: Record<string, string>,
): Promise<Pet> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/pet/${pathParams.petId}`;

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
  return PetSchema.parse(data);
}

/**
 * Updates a pet in the store with form data.
 * Updates a pet resource based on the form data.
 * OperationId: updatePetWithForm
 */
export async function post(
  pathParams: {
    petId: number;
  },
  queryParams?: {
    name?: string;
    status?: string;
  },
  headers?: Record<string, string>,
): Promise<Pet> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/pet/${pathParams.petId}`;

  // Add query parameters
  if (queryParams) {
    const searchParams = new URLSearchParams();
    if (queryParams.name !== undefined)
      searchParams.append("name", String(queryParams.name));
    if (queryParams.status !== undefined)
      searchParams.append("status", String(queryParams.status));
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
  };

  // Make the request
  const response = await fetch(url, options);

  // Handle the response
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }

  // Parse the response
  const data = await response.json();
  return PetSchema.parse(data);
}

/**
 * Deletes a pet.
 * Delete a pet.
 * OperationId: deletePet
 */
export async function del(
  pathParams: {
    petId: number;
  },
  headers?: Record<string, string>,
): Promise<void> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/pet/${pathParams.petId}`;

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
  uploadImage: uploadImageRoutes,
  get,
  post,
  del,
};
