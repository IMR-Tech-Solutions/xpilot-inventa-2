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
  const response = await api.post("add-customer/", customerData);
  return response.data;
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

// Get all animal types (shared master list)
export const getanimaltypesservice = async () => {
  const response = await api.get("animal-types/");
  return response.data;
};

// Add animal to customer (creates AnimalType if new name provided)
export const addcustomeranimalservice = async (
  customerID: number,
  data: { animal_type_id?: number; animal_name?: string; count: number }
) => {
  const response = await api.post(`customer/${customerID}/add-animal/`, data);
  return response.data;
};

// Delete a CustomerAnimal entry
export const deletecustomeranimalservice = async (animalEntryID: number) => {
  await api.delete(`customer-animal/${animalEntryID}/`);
};
