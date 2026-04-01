import { getAllPaginatedData } from "./getpaginateddata";
import api from "./baseapi";
import { ShopOrderPayload } from "../types/types";

// Get all available stocked products....
export const getproductsforshopservice = () => {
  const allShopProducts = getAllPaginatedData("shop/products/");
  return allShopProducts;
};

// Get all available categories....
export const getcategoriesforshopservice = () => {
  const allShopCategories = getAllPaginatedData("shop/categories/");
  return allShopCategories;
};

//Place Shop Order
export const addshoporderservice = async (orderData: ShopOrderPayload) => {
  const response = await api.post("orders/place/", orderData);
  return response.data;
};

// Get all the placed shop orders for shop owners
export const getallmyshopordersservice = () => {
  const allmyshoporders = getAllPaginatedData("orders/");
  return allmyshoporders;
};

export const getshopownerorderdetail = async (shopownerorderID: number) => {
  const response = await api.get(`orders/${shopownerorderID}/`);
  return response.data;
};

// Get all the shop ordered products
export const getmyallshopproducts = () => {
  const allmyshopproducts = getAllPaginatedData("shopowner-products/");
  return allmyshopproducts;
};

// Get all the shop ordered products
export const getmyallactiveshopproducts = () => {
  const allmyshopproducts = getAllPaginatedData("active/shopowner-products/");
  return allmyshopproducts;
};

// Get all the shop ordered products categories
export const getmyallshopproductcategories = () => {
  const allmyshopproductcategories = getAllPaginatedData(
    "shopowner-categories/"
  );
  return allmyshopproductcategories;
};

//update purchase product selling price
export const updatepurchaseproductpriceservice = async (
  productID: number,
  changedPrice: number
) => {
  const response = await api.put(
    `shopowner-product/${productID}/update-price/`,
    { selling_price: changedPrice }
  );
  return response.data;
};

//gte shop order status data
export const getorderstatusservice = async (shopownerorderID: number) => {
  const response = await api.get(`orders/${shopownerorderID}/status/`);
  return response.data;
};

//make product active
export const makeshopownerproductactive = async (productID: number) => {
  await api.post(`products/${productID}/toggle-active/`);
};

//confrim delivery and get all products
export const confrimshoporderservice = async (orderID: number) => {
  await api.post(`orders/${orderID}/confirm-delivery/`);
};

//cancel the placed order
export const cancelshoporderservice = async (orderID: number) => {
  await api.put(`orders/${orderID}/cancel/`);
};

//get shop owner product purchase history
export const getpurchaseproducthistory = async (productID: number) => {
  const response = await api.get(`products/${productID}/purchase-history/`);
  return response.data;
};

//shop owner product inovice view
export const getshopownerproductinvoiceview = async (
  orderID: number,
  itemID: number
) => {
  const response = await api.get(
    `orders/${orderID}/items/${itemID}/invoice/view/`,
    {
      responseType: "blob",
    }
  );
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const pdfUrl = window.URL.createObjectURL(pdfBlob);

  window.open(pdfUrl, "_blank");
  return pdfUrl;
};

//shop owner product inovice view
export const getshopownerproductinvoicedownload = async (
  orderID: number,
  itemID: number
) => {
  const response = await api.get(
    `orders/${orderID}/items/${itemID}/invoice/pdf/`,
    {
      responseType: "blob",
    }
  );
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const downloadUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `invoice_${orderID}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
  return response.data;
};

// Get managers orders
export const getallmanagersshoporders = () => {
  const allManagerorders = getAllPaginatedData("manager/fulfilled-orders/");
  return allManagerorders;
};

//manger shop order inovice view
export const getmanagershoporderinvoice = async (orderID: number) => {
  const response = await api.get(`manager/orders/${orderID}/invoice/view/`, {
    responseType: "blob",
  });
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const pdfUrl = window.URL.createObjectURL(pdfBlob);

  window.open(pdfUrl, "_blank");
  return pdfUrl;
};

// manager shop order invoice download
export const getmanagershoporderinvoicedownload = async (orderID: number) => {
  const response = await api.get(`manager/orders/${orderID}/invoice/pdf/`, {
    responseType: "blob",
  });
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const downloadUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `invoice_${orderID}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
  return response.data;
};

//Manager Delivery Chalan
export const getmanagershoporderdeliverychalandownload = async (
  orderID: number
) => {
  const response = await api.get(
    `manager/orders/${orderID}/delivery-challan/pdf/`,
    {
      responseType: "blob",
    }
  );
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const downloadUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `invoice_${orderID}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
  return response.data;
};

// Manager updates order status (packing | delivery_in_progress | cancelled)
export const updateManagerOrderStatusService = async (
  orderID: number,
  newStatus: string
) => {
  const response = await api.patch(
    `manager/orders/${orderID}/update-status/`,
    { status: newStatus }
  );
  return response.data;
};