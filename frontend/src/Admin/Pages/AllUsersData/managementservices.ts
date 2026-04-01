import api from "../../../services/baseapi";

export const getAllUsersDataService = async () => {
  const response = await api.get("management/users/");
  return response.data;
};

export const getUserDetailService = async (userId: number) => {
  const response = await api.get(`management/users/${userId}/`);
  return response.data;
};
