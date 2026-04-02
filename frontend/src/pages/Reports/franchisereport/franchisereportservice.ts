import api from "../../../services/baseapi";

export const getUserFranchiseReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  shop_owner_id?: number;
}) => {
  const response = await api.get("reports/franchise/", { params });
  return response.data;
};
