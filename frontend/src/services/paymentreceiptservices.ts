import api from "./baseapi";

// ── POS Payment Receipts ───────────────────────────────────────────────────────

export const viewPOSPaymentReceiptService = async (
  orderID: number,
  transactionID: number
) => {
  const response = await api.get(
    `pos-orders/${orderID}/receipt/${transactionID}/view/`,
    { responseType: "blob" }
  );
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const pdfUrl = window.URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
  return pdfUrl;
};

export const downloadPOSPaymentReceiptService = async (
  orderID: number,
  transactionID: number
) => {
  const response = await api.get(
    `pos-orders/${orderID}/receipt/${transactionID}/pdf/`,
    { responseType: "blob" }
  );
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const downloadUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `receipt_order${orderID}_txn${transactionID}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

// ── Shop Payment Receipts ──────────────────────────────────────────────────────

export const viewShopPaymentReceiptService = async (
  orderID: number,
  transactionID: number
) => {
  const response = await api.get(
    `manager/orders/${orderID}/receipt/${transactionID}/view/`,
    { responseType: "blob" }
  );
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const pdfUrl = window.URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
  return pdfUrl;
};

export const downloadShopPaymentReceiptService = async (
  orderID: number,
  transactionID: number
) => {
  const response = await api.get(
    `manager/orders/${orderID}/receipt/${transactionID}/pdf/`,
    { responseType: "blob" }
  );
  const pdfBlob = new Blob([response.data], { type: "application/pdf" });
  const downloadUrl = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `receipt_order${orderID}_txn${transactionID}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};
