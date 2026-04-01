import { getAllPaginatedData } from "./getpaginateddata";
import api from "./baseapi";

// Get all customers -- admin only
export const getallcustomersservice = () => {
  const allCustomers = getAllPaginatedData("admin/all-customers/");
  return allCustomers;
};

// Get particular user customers -- admin only
export const getallusercustomersservice = (userID: number) => {
  const allUserCustomers = getAllPaginatedData(
    `admin/user-customers/${userID}/`
  );
  return allUserCustomers;
};

// Add Customer Data
export const addcustomerservice = async (customerData: FormData) => {
  await api.post("add-customer/", customerData);
};

// Get logged-in user's customers
export const getmycustomersservice = () => {
  const myCustomers = getAllPaginatedData("my-customers/");
  return myCustomers;
};

// Delete Customer
export const deletecustomerservice = async (customerID: number) => {
  await api.delete(`delete-customer/${customerID}/`);
};

// Get single customer data
export const getsinglecustomerservice = async (customerID: number) => {
  const response = await api.get(`customer/${customerID}/`);
  const singleCustomer = response.data;
  return singleCustomer;
};

// Update Customer
export const updatecustomerservice = async (
  customerID: number,
  updatedData: FormData
) => {
  await api.put(`update-customer/${customerID}/`, updatedData);
};
