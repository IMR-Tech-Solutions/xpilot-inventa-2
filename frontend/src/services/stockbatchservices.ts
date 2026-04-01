import { getAllPaginatedData } from "./getpaginateddata";
import api from "./baseapi";
import { StockBatchData, StockEntryPayload } from "../types/types";

// Add a single stock entry
export const addstockentryservice = async (payload: StockEntryPayload) => {
  const response = await api.post("stock/add/", payload);
  return response.data;
};

// Bulk add stock entries (one invoice, multiple products)
export const bulkaddstockentryservice = async (payload: Record<string, any>) => {
  const response = await api.post("stock/bulk-add/", payload);
  return response.data;
};

// Get all stock entries for the current user
export const getmystockentriesservice = () => {
  return getAllPaginatedData("stock/");
};

// Get stock entries for a specific product
export const getproductstockentriesservice = async (productID: number) => {
  const response = await api.get(`stock/product/${productID}/`);
  return response.data;
};

// Bulk create stock batches
export const bulkcreatestockbatchservice = async (
  batchData: StockBatchData
) => {
  await api.post("stock-batches/bulk-create/", batchData);
};

// Get all batches for a specific product (no pagination)
export const getproductbatcheservice = async (productID: number) => {
  const response = await api.get(`stock-batches/product/${productID}/`);
  return response.data;
};

// Update batch status (PATCH + FormData)
export const updatestockbatchstatusservice = async (
  batchID: number,
  statusData: FormData
) => {
  await api.patch(`stock-batches/${batchID}/status/`, statusData);
};

// Delete batch
// export const deletestockbatchservice = async (batchID: number) => {
//   await api.delete(`stock-batches/delete/${batchID}/`);
// };

// GET single batch details
export const getsinglebatchdetails = async (batchID: number) => {
  const response = await api.get(`stock-batches/stock/${batchID}/`);
  return response.data;
};

// Update batch (PUT)
export const updatestockbatchservice = async (
  batchID: number,
  updatedData: FormData
) => {
  await api.put(`stock-batches/update/${batchID}/`, updatedData);
};

// Get current user's active stock batches (paginated)
export const getmyactivebatcheservice = () => {
  return getAllPaginatedData("user/stock-batches/");
};

// Get all active batches -- admin only (paginated)
export const getallactivebatcheservice = () => {
  return getAllPaginatedData("admin/stock-batches/");
};

// Get all active batches -- admin only (paginated)
export const getparticularuseractivebatcheservice = (userID: number) => {
  return getAllPaginatedData(`admin/stock-batches/${userID}`);
};
