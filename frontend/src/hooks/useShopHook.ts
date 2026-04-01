import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getproductsforshopservice,
  getcategoriesforshopservice,
  addshoporderservice,
} from "../services/shopservices";
import { toast } from "react-toastify";
import { handleError } from "../utils/handleError";

export const useShopCategories = () => {
  return useQuery({
    queryKey: ["shop-categories"],
    queryFn: getcategoriesforshopservice,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useShopProducts = () => {
  return useQuery({
    queryKey: ["shop-products"],
    queryFn: getproductsforshopservice,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useAddShopOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addshoporderservice,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products"],
      });
      toast.success("Order placed successfully!");
    },
    onError: (error) => {
      console.error("Error placing shop order:", error);
      handleError(error);
      toast.error("Failed to place order");
    },
  });
};
