import { getAllPaginatedData } from "./getpaginateddata";
import api from "./baseapi";

// Get all products -- admin only
export const getallproductservice = () => {
  const allProducts = getAllPaginatedData("admin/all-products/");
  return allProducts;
};

// Get particular user's products -- admin only
export const getalluserproductsservice = (userID: number) => {
  const allUserProducts = getAllPaginatedData(`admin/user-products/${userID}/`);
  return allUserProducts;
};

// Add product
export const addproductservice = async (productData: FormData) => {
  await api.post("add-product/", productData);
};

// Get products with stock > 0 for POS (user/stock/products/)
export const stockaddedbyuserservice = () => {
  return getAllPaginatedData("user/stock/products/");
};

// Get current user's products
export const getmyproductservice = () => {
  const myProducts = getAllPaginatedData("my-products/");
  return myProducts;
};

//get current user's active products
export const getmyactiveproductservice = () => {
  const myActiveProducts = getAllPaginatedData("active/my-products/");
  return myActiveProducts;
};

// Delete product
export const deleteproductservice = async (productID: number) => {
  await api.delete(`delete-product/${productID}/`);
};

// Get single product details
export const getsingleproductservice = async (productID: number) => {
  const response = await api.get(`product/${productID}/`);
  return response.data;
};

// Update product
export const updateproductservice = async (
  productID: number,
  updatedData: FormData
) => {
  await api.put(`update-product/${productID}/`, updatedData);
};

//all the unit for user
export const getUnitsForUserService = () => {
  return getAllPaginatedData("unit/all/");
};

// Get single unit details
export const getUnitDetailsService = async (unitID: number) => {
  const response = await api.get(`unit/${unitID}/`);
  return response.data;
};

// Add new unit
export const addUnitService = async (unitData: FormData) => {
  await api.post("unit/add/", unitData);
};

// Update existing unit
export const updateUnitService = async (unitID: number, updatedData: any) => {
  await api.put(`unit/update/${unitID}/`, updatedData);
};

// Delete unit
export const deleteUnitService = async (unitID: number) => {
  await api.delete(`unit/delete/${unitID}/`);
};
