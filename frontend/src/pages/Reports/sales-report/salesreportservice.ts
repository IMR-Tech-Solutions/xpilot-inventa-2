import api from "../../../services/baseapi";

export const getUserSalesReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  customer_id?: number;
}) => {
  const response = await api.get("reports/sales/", { params });
  return response.data;
};
