import { getAllPaginatedData } from "./getpaginateddata";
import api from "./baseapi";

// Get all vendors -- admin only
export const getallvendorservice = () => {
  const allVendors = getAllPaginatedData("admin/all-vendors/");
  return allVendors;
};

// Get particular user's vendors -- admin only
export const getalluservendorsservice = (userID: number) => {
  const allUserVendors = getAllPaginatedData(`admin/user-vendors/${userID}/`);
  return allUserVendors;
};

// Add vendor
export const addvendorservice = async (vendorData: FormData) => {
  await api.post("add-vendor/", vendorData);
};

// Get current user's vendors
export const getmyvendorservice = () => {
  const myVendors = getAllPaginatedData("my-vendors/");
  return myVendors;
};

// Get current user's active vendors
export const getmyactivevendorservice = () => {
  const myActiveVendors = getAllPaginatedData("active/my-vendors/");
  return myActiveVendors;
};

// Delete vendor
export const deletevendorservice = async (vendorID: number) => {
  await api.delete(`delete-vendor/${vendorID}/`);
};

// Get single vendor details
export const getsinglevendorservice = async (vendorID: number) => {
  const response = await api.get(`vendor/${vendorID}/`);
  return response.data;
};

// Update vendor
export const updatevendorservice = async (
  vendorID: number,
  updatedData: FormData
) => {
  await api.put(`update-vendor/${vendorID}/`, updatedData);
};

export const getVendorInvoicesService = () => {
  const allInvoices = getAllPaginatedData("vendor-invoices/");
  return allInvoices;
};

export const viewVendorInvoicePDFService = async (invoiceId: number) => {
  const response = await api.get(`vendor-invoices/${invoiceId}/view/`, {
    responseType: "blob",
  });

  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const pdfUrl = window.URL.createObjectURL(pdfBlob);

  window.open(pdfUrl, "_blank");
  return pdfUrl;
};

export const downloadVendorInvoicePDFService = async (
  invoiceId: number,
  invoiceNumber?: string
) => {
  const response = await api.get(`vendor-invoices/${invoiceId}/pdf/`, {
    responseType: "blob",
  });
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const downloadUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `invoice_${invoiceNumber || invoiceId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
  return response.data;
};

// Get single vendor details
export const getbrokercomissionforinvoice = async (invoiceId: number) => {
  const response = await api.get(`/invoices/${invoiceId}/broker-commissions/`);
  return response.data;
};
