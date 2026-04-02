import api from "../../../services/baseapi";

export const getAdminBrokerReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  user_id?: number;
  broker_id?: number;
}) => {
  const response = await api.get("reports/admin/broker/", { params });
  return response.data;
};
