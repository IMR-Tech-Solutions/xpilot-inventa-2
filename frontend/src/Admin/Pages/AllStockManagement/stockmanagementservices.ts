import api from "../../../services/baseapi";

export const getAllStockManagementService = async () => {
  const response = await api.get("management/stock/");
  return response.data;
};

export const getProductStockDetailService = async (productId: number) => {
  const response = await api.get(`management/stock/${productId}/`);
  return response.data;
};
