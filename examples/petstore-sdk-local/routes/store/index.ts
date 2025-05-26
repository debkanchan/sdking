import { routes as inventoryRoutes } from "./inventory/index.js";
import { routes as orderRoutes } from "./order/index.js";

export const routes = {
  inventory: inventoryRoutes,
  order: orderRoutes,
};
