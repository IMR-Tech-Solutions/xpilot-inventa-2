import api from "../../../services/baseapi";

export const getAdminFranchiseReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  manager_id?: number;
  shop_owner_id?: number;
}) => {
  const response = await api.get("reports/admin/franchise/", { params });
  return response.data;
};
