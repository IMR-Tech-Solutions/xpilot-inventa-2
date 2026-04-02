import api from "../../../services/baseapi";

export const getUserPurchaseReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  vendor_id?: number;
}) => {
  const response = await api.get("reports/purchase/", { params });
  return response.data;
};
