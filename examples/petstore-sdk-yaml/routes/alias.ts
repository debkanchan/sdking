/**
 * Alias definitions for operationIds
 * This file maps operationId values to their corresponding route functions
 */

import * as pet from './pet/index.js';
import * as pet_findByStatus from './pet/findByStatus/index.js';
import * as pet_findByTags from './pet/findByTags/index.js';
import * as pet_$petId from './pet/$petId/index.js';
import * as pet_$petId_uploadImage from './pet/$petId/uploadImage/index.js';
import * as store_inventory from './store/inventory/index.js';
import * as store_order from './store/order/index.js';
import * as store_order_$orderId from './store/order/$orderId/index.js';
import * as user from './user/index.js';
import * as user_createWithList from './user/createWithList/index.js';
import * as user_login from './user/login/index.js';
import * as user_logout from './user/logout/index.js';
import * as user_$username from './user/$username/index.js';

export const aliases =  {
  updatePet: pet.put,
  addPet: pet.post,
  findPetsByStatus: pet_findByStatus.get,
  findPetsByTags: pet_findByTags.get,
  getPetById: pet_$petId.get,
  updatePetWithForm: pet_$petId.post,
  deletePet: pet_$petId.del,
  uploadFile: pet_$petId_uploadImage.post,
  getInventory: store_inventory.get,
  placeOrder: store_order.post,
  getOrderById: store_order_$orderId.get,
  deleteOrder: store_order_$orderId.del,
  createUser: user.post,
  createUsersWithListInput: user_createWithList.post,
  loginUser: user_login.get,
  logoutUser: user_logout.get,
  getUserByName: user_$username.get,
  updateUser: user_$username.put,
  deleteUser: user_$username.del,
}
