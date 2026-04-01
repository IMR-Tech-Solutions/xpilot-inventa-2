import { getAllPaginatedData } from "./getpaginateddata";
import api from "./baseapi";

// Get all transporters -- admin only
export const getAllTransporterService = () => {
  return getAllPaginatedData("admin/all-transporters/");
};

// Get particular user's transporters -- admin only
export const getAllUserTransportersService = (userID: number) => {
  return getAllPaginatedData(`admin/user-transporters/${userID}/`);
};

// Add transporter
export const addTransporterService = async (transporterData: FormData) => {
  await api.post("add-transporter/", transporterData);
};

// Get current user's transporters
export const getMyTransporterService = () => {
  return getAllPaginatedData("my-transporters/");
};

// Get current user's active transporters
export const getMyActiveTransporterService = () => {
  return getAllPaginatedData("active/my-transporters/");
};

// Delete transporter
export const deleteTransporterService = async (transporterID: number) => {
  await api.delete(`delete-transporter/${transporterID}/`);
};

// Get single transporter details
export const getSingleTransporterService = async (transporterID: number) => {
  const response = await api.get(`transporter/${transporterID}/`);
  return response.data;
};

// Update transporter
export const updateTransporterService = async (
  transporterID: number,
  updatedData: FormData
) => {
  await api.put(`update-transporter/${transporterID}/`, updatedData);
};

