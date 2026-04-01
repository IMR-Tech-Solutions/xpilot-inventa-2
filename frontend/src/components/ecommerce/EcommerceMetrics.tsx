import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useConsolidatedDashboard } from "../../hooks/useDashboardData";

export default function EcommerceMetrics() {
  const {
    data: dashboardData,
    isLoading,
    isError,
    // error,
    // isFetching,
    refetch,
  } = useConsolidatedDashboard();

  const getBadgeProps = (percentage: number) => {
    const isPositive = percentage >= 0;
    return {
      color: isPositive ? ("success" as const) : ("error" as const),
      icon: isPositive ? ArrowUpIcon : ArrowDownIcon,
      percentage: Math.abs(percentage),
    };
  };

  // Remove the full error return - keep the UI structure

  const userSummary = dashboardData?.user_summary;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Error indicator - subtle notification */}
      {isError && (
        <div className="col-span-full mb-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between dark:bg-gray-800/50 dark:border-gray-700">
            <span className="text-gray-400 dark:text-gray-600 text-sm">
              Unable to load metrics data
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

      {/* Customers Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Customers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? (
                <span className="text-sm animate-pulse">Loading...</span>
              ) : isError ? (
                <span className="text-gray-400 dark:text-gray-600 text-sm">
                  Error
                </span>
              ) : (
                userSummary?.total_customers || 0
              )}
            </h4>
          </div>

          {userSummary &&
            !isLoading &&
            !isError &&
            (() => {
              const {
                color,
                icon: Icon,
                percentage,
              } = getBadgeProps(
                userSummary.customers_comparison.percentage_change
              );
              return (
                <Badge color={color}>
                  <Icon />
                  {percentage.toFixed(2)}%
                </Badge>
              );
            })()}
        </div>
      </div>

      {/* Orders Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Orders
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? (
                <span className="text-sm animate-pulse">Loading...</span>
              ) : isError ? (
                <span className="text-gray-400 dark:text-gray-600 text-sm">
                  Error
                </span>
              ) : (
                userSummary?.total_orders || 0
              )}
            </h4>
          </div>

          {userSummary &&
            !isLoading &&
            !isError &&
            (() => {
              const {
                color,
                icon: Icon,
                percentage,
              } = getBadgeProps(
                userSummary.orders_comparison.percentage_change
              );
              return (
                <Badge color={color}>
                  <Icon />
                  {percentage.toFixed(2)}%
                </Badge>
              );
            })()}
        </div>
      </div>
    </div>
  );
}
