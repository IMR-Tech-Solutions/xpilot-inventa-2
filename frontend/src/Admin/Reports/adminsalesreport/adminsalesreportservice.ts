import api from "../../../services/baseapi";

export const getAdminSalesReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  user_id?: number;
}) => {
  const response = await api.get("reports/admin/sales/", { params });
  return response.data;
};
