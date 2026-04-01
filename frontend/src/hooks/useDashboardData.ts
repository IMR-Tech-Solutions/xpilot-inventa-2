import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDashboardSummary } from "../services/summaryservice";

export const useConsolidatedDashboard = (
  params: {
    year?: number;
    month?: number;
    period?: string;
  } = {}
) => {
  return useQuery({
    queryKey: ["consolidated-dashboard", params],
    queryFn: () => getDashboardSummary(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 1 * 60 * 1000,
    select: (data) => ({
      ...data,
      formattedRevenue: data.todays_sales?.revenue
        ? new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(data.todays_sales.revenue)
        : "₹0",
    }),
  });
};

export const useDashboardActions = () => {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    return queryClient.invalidateQueries({
      queryKey: ["consolidated-dashboard"],
    });
  };

  const refreshSales = () => {
    return queryClient.invalidateQueries({
      queryKey: ["consolidated-dashboard"],
    });
  };

  const prefetchNextMonth = (currentMonth: number, currentYear: number) => {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    return queryClient.prefetchQuery({
      queryKey: [
        "consolidated-dashboard",
        { month: nextMonth, year: nextYear },
      ],
      queryFn: () => getDashboardSummary({ month: nextMonth, year: nextYear }),
      staleTime: 5 * 60 * 1000,
    });
  };

  return { refreshAll, refreshSales, prefetchNextMonth };
};

export const usePOSStockData = (params = {}) => {
  return useQuery({
    queryKey: ["consolidated-dashboard", params],
    queryFn: () => getDashboardSummary(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 1 * 60 * 1000,
    select: (data) => ({
      total_pos_sales: data.metrics?.total_pos_sales || 0,
      total_stock_added: data.stock_summary?.total_stock_added || 0,
      source: data.stock_summary?.source || null,
    }),
  });
};

export const useTodaysSalesData = (params = {}) => {
  return useQuery({
    queryKey: ["consolidated-dashboard", params],
    queryFn: () => getDashboardSummary(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 1 * 60 * 1000,
    select: (data) => ({
      todays_orders: data.todays_sales?.orders_count || 0,
      todays_revenue: data.todays_sales?.revenue || 0,
      this_month_revenue: data.todays_sales?.this_month_revenue || 0,
      last_month_revenue: data.todays_sales?.last_month_revenue || 0,
      sales_percentage_change: data.todays_sales?.sales_percentage_change || 0,
      progress_percentage: data.todays_sales?.progress_percentage || 0,
    }),
  });
};


export const useSalesStatisticsData = (
  params: {
    period?: string;
    year?: number;
  } = {}
) => {
  return useQuery({
    queryKey: ["consolidated-dashboard", params],
    queryFn: () => getDashboardSummary(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 1 * 60 * 1000,
    select: (data) => data.sales_statistics,
  });
};
