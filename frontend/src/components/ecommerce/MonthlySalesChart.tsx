import { BoxIconLine, GroupIcon } from "../../icons";
import { usePOSStockData } from "../../hooks/useDashboardData";

export default function MonthlySalesChart() {
  const {
    data: posData,
    isLoading,
    isError,
    // error,
    // isFetching,
    refetch,
  } = usePOSStockData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Remove the full error return - keep the UI structure

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Error indicator - subtle notification */}
      {isError && (
        <div className="col-span-full mb-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between dark:bg-gray-800/50 dark:border-gray-700">
            <span className="text-gray-400 dark:text-gray-600 text-sm">
              Unable to load sales and stock data
            </span>
            <button
              onClick={() => refetch()}
              className="text-gray-400 dark:text-gray-600 underline text-sm hover:text-gray-500"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* POS Sales Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div className="break-all">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              POS Sales
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? (
                <span className="text-sm animate-pulse">Loading...</span>
              ) : isError ? (
                <span className="text-gray-400 dark:text-gray-600 text-sm">
                  Error
                </span>
              ) : (
                formatCurrency(posData?.total_pos_sales || 0)
              )}
            </h4>
          </div>
        </div>
      </div>

      {/* Inventory Stock Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div className="break-all">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Inventory Stock
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? (
                <span className="text-sm animate-pulse">Loading...</span>
              ) : isError ? (
                <span className="text-gray-400 dark:text-gray-600 text-sm">
                  Error
                </span>
              ) : (
                `${posData?.total_stock_added || 0} Items`
              )}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
