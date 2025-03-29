import { z } from "zod";
import { Pet, PetSchema } from "../../schemas/index.js";
import { sdkConfig } from "../../config.js";

import { routes as findByStatusRoutes } from './findByStatus/index.js';
import { routes as findByTagsRoutes } from './findByTags/index.js';
import { routes as $petIdRoutes } from './$petId/index.js';

/**
 * Update an existing pet.
 * Update an existing pet by Id.
 * OperationId: updatePet
 */
export async function put(body: Pet, headers?: Record<string, string>): Promise<Pet> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/pet`;

  // Prepare fetch options
  const options: RequestInit = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
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
  return PetSchema.parse(data);
}

/**
 * Add a new pet to the store.
 * Add a new pet to the store.
 * OperationId: addPet
 */
export async function post(body: Pet, headers?: Record<string, string>): Promise<Pet> {
  // Construct the URL with path parameters
  let url = `${sdkConfig.baseUrl}/pet`;

  // Prepare fetch options
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  return PetSchema.parse(data);
}

export const routes = {
  findByStatus: findByStatusRoutes,
  findByTags: findByTagsRoutes,
  $petId: $petIdRoutes,
  put,
  post,
};
