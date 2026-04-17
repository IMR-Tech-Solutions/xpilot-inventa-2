import api from "../../../services/baseapi";

export const getShopOwnerPurchaseReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  manager_id?: number;
}) => {
  const response = await api.get("reports/shop-owner/purchase/", { params });
  return response.data;
};
