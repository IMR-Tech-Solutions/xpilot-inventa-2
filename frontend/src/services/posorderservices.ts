import { getAllPaginatedData } from "./getpaginateddata";
import api from "./baseapi";
import { POSOrderPayload } from "../types/types";

// Get all POS orders --admin only
export const getallposordersservice = () => {
  const allPOSOrders = getAllPaginatedData("admin/all-pos-orders/");
  return allPOSOrders;
};

// Get particular user POS orders --admin only
export const getalluserposordersservice = (userID: number) => {
  const allUserPOSOrders = getAllPaginatedData(
    `admin/user-pos-orders/${userID}/`
  );
  return allUserPOSOrders;
};

// Add POS Order Data
export const addposorderservice = async (orderData: POSOrderPayload) => {
  const response = await api.post("add-pos-order/", orderData);
  return response.data;
};

// Add Shop POS Order Data
export const addshopposorderservice = async (orderData: POSOrderPayload) => {
  const response = await api.post("add-shoppos-order/", orderData);
  return response.data;
};

// Get particular user POS orders
export const getmyposordersservice = () => {
  const myPOSOrders = getAllPaginatedData("my-pos-orders/");
  return myPOSOrders;
};

// Cancel POS Order
export const cancelposorderservice = async (orderID: number) => {
  const response = await api.put(`cancel-pos-order/${orderID}/`);
  return response.data;
};

// Get single POS order data
export const getsingleposorderservice = async (orderID: number) => {
  const response = await api.get(`pos-order/${orderID}/`);
  const singlePOSOrder = response.data;
  return singlePOSOrder;
};

// Update POS Order Status
export const updateposorderservice = async (
  orderID: number,
  updatedData: POSOrderPayload
) => {
  const response = await api.put(`update-pos-order/${orderID}/`, updatedData);
  return response.data;
};

//GET products based on category
export const getproductsincategoryservice = (categoryID: number) => {
  const allProductsinCategory = getAllPaginatedData(
    `category/${categoryID}/products/`
  );
  return allProductsinCategory;
};

//View POS order
export const viewPOSorderService = async (posorderID: number) => {
  const response = await api.get(`pos-orders/${posorderID}/invoice/view/`, {
    responseType: "blob",
  });

  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const pdfUrl = window.URL.createObjectURL(pdfBlob);

  window.open(pdfUrl, "_blank");
  return pdfUrl;
};

//Download POS orders
export const downloadPOSorderService = async (posorderID: number) => {
  const response = await api.get(`pos-orders/${posorderID}/invoice/view/`, {
    responseType: "blob",
  });
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const downloadUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `invoice_${posorderID}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
  return response.data;
};

// POS categories
export const getcategoriesofproducts = () => {
  const allCategoriesofaddedproducts = getAllPaginatedData(
    "user/stock/categories/"
  );
  return allCategoriesofaddedproducts;
};
