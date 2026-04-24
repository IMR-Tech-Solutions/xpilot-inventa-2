import api from "./baseapi";
import { getAllPaginatedData } from "./getpaginateddata";

// ── Shop list for buyer dropdown ──────────────────────────────────────────────
export const getS2SShopListService = async () => {
  const response = await api.get("s2s/shops/");
  return response.data;
};

// ── Products of a specific seller shop ───────────────────────────────────────
export const getS2SShopProductsService = async (sellerId: number) => {
  const response = await api.get(`s2s/shops/${sellerId}/products/`);
  return response.data;
};

// ── Buyer: place S2S order ────────────────────────────────────────────────────
export const placeS2SOrderService = async (payload: {
  seller_id: number;
  items: { seller_product_id: number; requested_quantity: number }[];
}) => {
  const response = await api.post("s2s/orders/place/", payload);
  return response.data;
};

// ── Buyer: list own S2S orders ────────────────────────────────────────────────
export const getBuyerS2SOrdersService = () =>
  getAllPaginatedData("s2s/orders/");

// ── Buyer: S2S order detail ───────────────────────────────────────────────────
export const getBuyerS2SOrderDetailService = async (orderId: number) => {
  const response = await api.get(`s2s/orders/${orderId}/`);
  return response.data;
};

// ── Buyer: confirm delivery ───────────────────────────────────────────────────
export const confirmS2SDeliveryService = async (orderId: number) => {
  const response = await api.post(`s2s/orders/${orderId}/confirm-delivery/`);
  return response.data;
};

// ── Buyer: cancel order ───────────────────────────────────────────────────────
export const cancelS2SOrderService = async (orderId: number) => {
  const response = await api.put(`s2s/orders/${orderId}/cancel/`);
  return response.data;
};

// ── Seller: incoming orders ───────────────────────────────────────────────────
export const getSellerS2SOrdersService = () =>
  getAllPaginatedData("s2s/seller/orders/");

// ── Seller: order detail ──────────────────────────────────────────────────────
export const getSellerS2SOrderDetailService = async (orderId: number) => {
  const response = await api.get(`s2s/seller/orders/${orderId}/`);
  return response.data;
};

// ── Seller: accept item ───────────────────────────────────────────────────────
export const acceptS2SItemService = async (
  orderId: number,
  itemId: number,
  payload: { offered_quantity: number; offered_price: number }
) => {
  const response = await api.post(
    `s2s/seller/orders/${orderId}/items/${itemId}/accept/`,
    payload
  );
  return response.data;
};

// ── Seller: reject item ───────────────────────────────────────────────────────
export const rejectS2SItemService = async (orderId: number, itemId: number) => {
  const response = await api.post(
    `s2s/seller/orders/${orderId}/items/${itemId}/reject/`
  );
  return response.data;
};

// ── Seller: update order status ───────────────────────────────────────────────
export const updateS2SOrderStatusService = async (
  orderId: number,
  newStatus: string,
  deliveryDetails?: {
    delivery_transporter?: number | null;
    delivery_from?: string;
    delivery_to?: string;
    delivery_transporter_cost?: string | number;
  }
) => {
  const response = await api.patch(
    `s2s/seller/orders/${orderId}/update-status/`,
    { status: newStatus, ...deliveryDetails }
  );
  return response.data;
};

// ── Invoice: view S2S invoice in browser ─────────────────────────────────────
export const viewS2SInvoiceService = async (orderId: number) => {
  const response = await api.get(`s2s/orders/${orderId}/invoice/view/`, { responseType: "blob" });
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const pdfUrl = window.URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
  return pdfUrl;
};

// ── Invoice: download S2S invoice ────────────────────────────────────────────
export const downloadS2SInvoiceService = async (orderId: number) => {
  const response = await api.get(`s2s/orders/${orderId}/invoice/pdf/`, { responseType: "blob" });
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const downloadUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `s2s_invoice_${orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
  return response.data;
};

// ── Seller: record payment ────────────────────────────────────────────────────
export const recordS2SPaymentService = async (
  orderId: number,
  payload: {
    amount_paid: number;
    payment_method: string;
    online_amount?: number;
    offline_amount?: number;
  }
) => {
  const response = await api.patch(
    `s2s/seller/orders/${orderId}/record-payment/`,
    payload
  );
  return response.data;
};
