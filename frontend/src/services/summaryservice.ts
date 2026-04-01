import api from "./baseapi";

export const getDashboardSummary = async (
  params: {
    year?: number;
    month?: number;
    period?: string;
  } = {}
) => {
  const searchParams = new URLSearchParams();
  if (params.year) searchParams.append("year", params.year.toString());
  if (params.month) searchParams.append("month", params.month.toString());
  if (params.period) searchParams.append("period", params.period);

  const response = await api.get(`dashboard-summary/?${searchParams}`);
  return response.data;
};

export const getAdminDashboardData = async () => {
  const response = await api.get("admin/dashboard-summary/");
  return response.data.data;
};
