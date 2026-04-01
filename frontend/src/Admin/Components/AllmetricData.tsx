import { useQuery } from "@tanstack/react-query";
import {
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import { getAdminDashboardData } from "../../services/summaryservice";

const AllmetricData = () => {
  const {
    data: summaryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-dashboard-summary"],
    queryFn: getAdminDashboardData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="col-span-full">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between dark:bg-gray-800/50 dark:border-gray-700">
            <span className="text-gray-400 dark:text-gray-600 text-sm">
              Error loading admin data: {error?.message}
            </span>
            <button
              onClick={() => refetch()}
              className="text-gray-400 dark:text-gray-600 underline text-sm hover:text-gray-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* Orders Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Orders
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? (
                <span className="text-sm animate-pulse">Loading...</span>
              ) : (
                summaryData?.total_pos_orders || 0
              )}
            </h4>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full dark:bg-green-500/15 dark:text-green-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 17l9.2-9.2M17 17V7H7"
              />
            </svg>
            <span className="text-xs font-medium">High Activity</span>
          </div>
        </div>
      </div>

      {/* Customers Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Customers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? (
                <span className="text-sm animate-pulse">Loading...</span>
              ) : (
                summaryData?.total_customers || 0
              )}
            </h4>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full dark:bg-blue-500/15 dark:text-blue-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 17l9.2-9.2M17 17V7H7"
              />
            </svg>
            <span className="text-xs font-medium">Growing Base</span>
          </div>
        </div>
      </div>

      {/* Products Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Products
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? (
                <span className="text-sm animate-pulse">Loading...</span>
              ) : (
                summaryData?.total_products || 0
              )}
            </h4>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-full dark:bg-gray-500/15 dark:text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            <span className="text-xs font-medium">Stable Inventory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllmetricData;
