import api from "../../../services/baseapi";

export const getUserTransporterReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  transporter_id?: number;
}) => {
  const response = await api.get("reports/transporter/", { params });
  return response.data;
};
