import { routes as petRoutes } from "./pet/index.js";
import { routes as storeRoutes } from "./store/index.js";
import { routes as userRoutes } from "./user/index.js";

export const pet = petRoutes;
export const store = storeRoutes;
export const user = userRoutes;

// Export a consolidated routes object that can be used as the SDK client
export const routes = {
  pet: petRoutes,
  store: storeRoutes,
  user: userRoutes,
};
