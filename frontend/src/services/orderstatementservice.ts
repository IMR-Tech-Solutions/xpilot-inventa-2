import api from "./baseapi";

export const getPOSOrderStatementService = async (orderID: number) => {
  const response = await api.get(`pos-orders/${orderID}/statement/`);
  return response.data;
};

export const getShopOrderStatementService = async (orderID: number) => {
  const response = await api.get(`manager/orders/${orderID}/statement/`);
  return response.data;
};
