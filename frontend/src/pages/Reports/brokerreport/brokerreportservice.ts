import api from "../../../services/baseapi";

export const getUserBrokerReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  broker_id?: number;
}) => {
  const response = await api.get("reports/broker/", { params });
  return response.data;
};
