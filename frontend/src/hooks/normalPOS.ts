import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getcategoriesofproducts,
  addposorderservice,
} from "../services/posorderservices";
import { stockaddedbyuserservice } from "../services/productservices";
import { getmycustomersservice } from "../services/customerservices";
import { toast } from "react-toastify";
import { handleError } from "../utils/handleError";



export const usePOSProductCategories = () => {
  return useQuery({
    queryKey: ["pos-product-categories"],
    queryFn: getcategoriesofproducts,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};


export const useManagerStockedProducts = () => {
  return useQuery({
    queryKey: ["manager-stocked-products"],
    queryFn: stockaddedbyuserservice,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};


export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: getmycustomersservice,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};


export const useAddManagerPOSOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addposorderservice,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["manager-stocked-products"],
      });
      toast.success("Order placed successfully!");
    },
    onError: (error) => {
      console.error("Error placing order:", error);
      handleError(error);
      toast.error("Failed to place order");
    },
  });
};
