import api from "../../services/baseapi";


export const getStockLedgerSummaryService = async () => {
  const res = await api.get("reports/stock-ledger/");
  return res.data;
};

export const getAdminStockLedgerSummaryService = async (
  filters: { user_id?: number | string } = {}
) => {
  const params = new URLSearchParams();
  if (filters.user_id) params.append("user_id", String(filters.user_id));
  const res = await api.get(`admin/reports/stock-ledger/?${params}`);
  return res.data;
};