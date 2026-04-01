import { getAllPaginatedData } from "./getpaginateddata";
import api from "./baseapi";

//admin -get all brokers
export const getallbrokerservice = () => {
  const myBrokers = getAllPaginatedData("admin/brokers/");
  return myBrokers;
};

//add broker
export const addbrokerservice = async (brokerData: FormData) => {
  await api.post("add-broker/", brokerData);
};

//get my brokers
export const getmybrokerservice = () => {
  const myBrokers = getAllPaginatedData("user-brokers/");
  return myBrokers;
};

//get my active brokers
export const getmyactivebrokerservice = () => {
  const myactiveBrokers = getAllPaginatedData("active/user-brokers/");
  return myactiveBrokers;
};

//get single broker
export const getsinglebrokerservice = async (brokerID: number) => {
  const response = await api.get(`broker/${brokerID}/`);
  return response.data;
};

//update broker
export const updatebrokerservice = async (
  brokerID: number,
  updatedData: FormData
) => {
  await api.put(`update-broker/${brokerID}/`, updatedData);
};

//delete broker
export const deletebrokerservice = async (brokerID: number) => {
  await api.delete(`delete-broker/${brokerID}/`);
};
