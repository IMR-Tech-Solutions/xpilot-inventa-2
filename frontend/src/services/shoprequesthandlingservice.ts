import { getAllPaginatedData } from "./getpaginateddata";
import api from "./baseapi";

// Get all request
export const getallrequestformanagerservice = () => {
  const allRequests = getAllPaginatedData("manager/requests/pending/");
  return allRequests;
};

export const acceptshoporderrequestservice = async (
  requestID: number,
  payload?: { offered_quantity?: number; offered_price?: number }
) => {
  const response = await api.post(
    `manager/requests/${requestID}/accept/`,
    payload || {}
  );
  return response.data;
};

export const shoporderrequestdetailservice = async (requestID: number) => {
  const response = await api.get(`manager/requests/${requestID}/`);
  return response.data;
};
