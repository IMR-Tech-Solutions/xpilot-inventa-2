import { getAllPaginatedData } from "./getpaginateddata";
import api from "./baseapi";

// Get all categories --admin only
export const getallcategoriesservice = () => {
  const allCategories = getAllPaginatedData("admin/all-categories/");
  return allCategories;
};

//Get particular user category --admin only
export const getallusercategoriesservice = (userID: number) => {
  const allUserCategories = getAllPaginatedData(
    `admin/user-categories/${userID}/`
  );
  return allUserCategories;
};

//Add Category Data
export const addcategoryservice = async (categoryData: FormData) => {
  await api.post("add-category/", categoryData);
};

//Get particular user data
export const getmycategoryservice = () => {
  const myCategories = getAllPaginatedData("my-categories/");
  return myCategories;
};

// Delete Categories
export const deletecategoryservice = async (categoryID: number) => {
  await api.delete(`delete-category/${categoryID}/`);
};

//Get single category data
export const getsinglecategoryservice = async (categoryID: number) => {
  const response = await api.get(`category/${categoryID}/`);
  const singleCategory = response.data;
  return singleCategory;
};

//Update Category
export const updatecategoryservice = async (
  categoryID: number,
  updatedData: FormData
) => {
  await api.put(`update-category/${categoryID}/`, updatedData);
};
