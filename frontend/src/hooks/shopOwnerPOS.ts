import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getmyallactiveshopproducts,
  getmyallshopproductcategories,
} from '../services/shopservices';
import { getmycustomersservice } from '../services/customerservices';
import { addshopposorderservice } from '../services/posorderservices';
import { toast } from 'react-toastify';
import { handleError } from '../utils/handleError';


export const usePOSCategories = () => {
  return useQuery({
    queryKey: ['shop-pos-categories'],
    queryFn: getmyallshopproductcategories,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const usePOSProducts = () => {
  return useQuery({
    queryKey: ['shop-pos-products'],
    queryFn: getmyallactiveshopproducts,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: getmycustomersservice,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useAddPOSOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addshopposorderservice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-pos-products'] });
      toast.success('Order placed successfully!');
    },
    onError: (error) => {
      console.error('Error placing order:', error);
      handleError(error);
    },
  });
};
