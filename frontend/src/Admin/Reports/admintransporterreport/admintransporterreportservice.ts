import api from "../../../services/baseapi";

export const getAdminTransporterReportService = async (params?: {
  start_date?: string;
  end_date?: string;
  transporter_id?: number;
  user_id?: number;
}) => {
  const response = await api.get("reports/admin/transporter/", { params });
  return response.data;
};
