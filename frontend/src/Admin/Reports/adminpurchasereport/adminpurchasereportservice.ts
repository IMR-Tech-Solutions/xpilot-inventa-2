import api from "../../../services/baseapi";

export const getAdminPurchaseReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  user_id?: number;
  vendor_id?: number;
}) => {
  const response = await api.get("reports/admin/purchase/", { params });
  return response.data;
};
