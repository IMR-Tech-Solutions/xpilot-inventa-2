// components/ecommerce/StatisticsChart.tsx
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { useSalesStatisticsData } from "../../hooks/useDashboardData";

interface POSSalesData {
  period: string;
  orders_count: number;
  total_revenue: number;
}

// interface POSSalesResponse {
//   period: string;
//   year: string;
//   data: POSSalesData[];
//   summary: {
//     total_orders: number;
//     total_revenue: number;
//     best_period: POSSalesData | null;
//     periods_count: number;
//   };
// }

export default function StatisticsChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("monthly");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Replace all useState, useEffect, and setInterval with this single hook
  const {
    data: salesData,
    isLoading,
    isError,
    // error,
    // isFetching,
    refetch,
  } = useSalesStatisticsData({ period: selectedPeriod, year: selectedYear });

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const getChartData = () => {
    if (!salesData?.data) {
      const categories =
        selectedPeriod === "monthly"
          ? [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ]
          : selectedPeriod === "quarterly"
          ? ["Q1", "Q2", "Q3", "Q4"]
          : ["2021", "2022", "2023", "2024", "2025"];

      return {
        categories,
        salesData: Array(categories.length).fill(0),
        revenueData: Array(categories.length).fill(0),
      };
    }

    return {
      categories: salesData.data.map((item: POSSalesData) => item.period),
      salesData: salesData.data.map((item: POSSalesData) => item.orders_count),
      revenueData: salesData.data.map((item: POSSalesData) =>
        Math.round(item.total_revenue / 1000)
      ),
    };
  };

  const { categories, salesData: chartSalesData, revenueData } = getChartData();

  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
      },
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: "dd MMM yyyy",
      },
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Orders",
      data: chartSalesData,
    },
    {
      name: "Revenue (₹K)",
      data: revenueData,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">

      {/* Error indicator - subtle notification */}
      {isError && (
        <div className="mb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between dark:bg-gray-800/50 dark:border-gray-700">
            <span className="text-gray-400 dark:text-gray-600 text-sm">
              Unable to load statistics data
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

      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Sales Statistics
            </h3>
            {/* Loading indicator in header */}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs">Loading...</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {selectedPeriod === "monthly" &&
              `Monthly performance for ${selectedYear}`}
            {selectedPeriod === "quarterly" &&
              `Quarterly performance for ${selectedYear}`}
            {selectedPeriod === "annual" && "Annual performance trends"}
          </p>
        </div>

        <div className="flex items-start w-full gap-3 sm:justify-end">
          {/* Fixed-width container to prevent layout shifts */}
          <div className="flex items-center gap-2 min-w-[200px] justify-end">
            {/* Period Selection - Compact Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 dark:bg-gray-800">
              {[
                { key: "monthly", label: "Monthly" },
                { key: "quarterly", label: "Quarterly" },
                { key: "annual", label: "Annual" },
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => handlePeriodChange(period.key)}
                  disabled={isLoading}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap disabled:opacity-50 ${
                    selectedPeriod === period.key
                      ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Year selector - Fixed width */}
            {(selectedPeriod === "monthly" ||
              selectedPeriod === "quarterly") && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                disabled={isLoading}
                className="w-16 px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Fixed height container prevents layout jumps */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full h-[310px]">
          {/* Chart with loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-gray-400 dark:text-gray-600 text-sm">
                  Loading chart...
                </span>
              </div>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-400 dark:text-gray-600 text-sm">
                Error loading chart data
              </span>
            </div>
          ) : (
            <Chart
              options={options}
              series={series}
              type="area"
              height={310}
              key={`${selectedPeriod}-${selectedYear}`} // Re-render on param change
            />
          )}
        </div>
      </div>
    </div>
  );
}
