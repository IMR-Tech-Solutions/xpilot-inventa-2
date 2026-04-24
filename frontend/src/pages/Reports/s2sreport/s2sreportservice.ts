import api from "../../../services/baseapi";

export const getS2SReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  role?: "buyer" | "seller";
}) => {
  const response = await api.get("reports/s2s/", { params });
  return response.data;
};
