// components/ecommerce/MonthlyTarget.tsx
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useTodaysSalesData } from "../../hooks/useDashboardData";

export default function MonthlyTarget() {
  const {
    data: salesData,
    isLoading,
    isError,
    // error,
    // isFetching,
    refetch,
  } = useTodaysSalesData();

  const series = [salesData?.progress_percentage || 0];

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: isError ? "#9CA3AF" : "#1D2939", // Gray color for error
            formatter: function (val) {
              return isError ? "Error" : val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: [isError ? "#9CA3AF" : "#465FFF"], // Gray color for error
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getBadgeStyle = (percentage: number) => {
    const isPositive = percentage >= 0;
    return {
      className: isPositive
        ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
        : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
      sign: isPositive ? "+" : "",
    };
  };

  const generateMessage = () => {
    if (isError) {
      return (
        <span className="text-gray-400 dark:text-gray-600">
          Unable to load sales data.
          <button
            onClick={() => refetch()}
            className="ml-2 text-gray-400 dark:text-gray-600 underline hover:text-gray-500"
          >
            Retry
          </button>
        </span>
      );
    }

    if (!salesData) return "";

    const { todays_revenue, sales_percentage_change } = salesData;
    const isPositive = sales_percentage_change >= 0;
    const trendWord = isPositive ? "higher" : "lower";
    const encouragement = isPositive
      ? "Keep up your great work!"
      : "Tomorrow is a new opportunity to bounce back!";

    return `You earned ${formatCurrency(
      todays_revenue
    )} today, it's ${trendWord} than last month. ${encouragement}`;
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Today's Sales
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Today's orders and revenue at a glance
            </p>
          </div>

          {/* Error indicator in header - subtle gray */}
          {isError && (
            <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Error
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
              Loading...
            </div>
          )}
        </div>

        <div className="relative">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart
              key={
                isError ? "error" : salesData?.progress_percentage || "loading"
              }
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          {/* Dynamic badge with API data */}
          {salesData &&
            !isLoading &&
            !isError &&
            (() => {
              const { className, sign } = getBadgeStyle(
                salesData.sales_percentage_change
              );
              return (
                <span
                  className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full px-3 py-1 text-xs font-medium ${className}`}
                >
                  {sign}
                  {Math.abs(salesData.sales_percentage_change)}%
                </span>
              );
            })()}

          {/* Error badge - subtle gray */}
          {isError && (
            <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600">
              Data Error
            </span>
          )}
        </div>

        {/* Dynamic message based on API data */}
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          {isLoading ? (
            <span className="animate-pulse">Loading today's sales data...</span>
          ) : (
            generateMessage()
          )}
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        {/* Today's Orders */}
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Today's Orders
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {isLoading ? (
              <span className="text-sm animate-pulse">...</span>
            ) : isError ? (
              <span className="text-gray-400 dark:text-gray-600 text-sm">
                Error
              </span>
            ) : (
              salesData?.todays_orders || 0
            )}
            {!isError && !isLoading && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.16475 2.08243 8.16516 2.08243 8.16556 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004L8.91435 13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5L7.41435 4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z"
                  fill="#039855"
                />
              </svg>
            )}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        {/* Today's Revenue */}
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Today's Revenue
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {isLoading ? (
              <span className="text-sm animate-pulse">...</span>
            ) : isError ? (
              <span className="text-gray-400 dark:text-gray-600 text-sm">
                Error
              </span>
            ) : (
              formatCurrency(salesData?.todays_revenue || 0)
            )}
            {!isError && !isLoading && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.16475 2.08243 8.16516 2.08243 8.16556 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004L8.91435 13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5L7.41435 4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z"
                  fill="#039855"
                />
              </svg>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
