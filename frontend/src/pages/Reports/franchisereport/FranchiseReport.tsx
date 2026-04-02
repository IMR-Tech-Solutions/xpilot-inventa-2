import { useState, useEffect } from "react";
import { getUserFranchiseReportService } from "./franchisereportservice";
import PageMeta from "../../../components/common/PageMeta";

interface FranchiseItem {
  id: number;
  order_number: string;
  order_id: number;
  shop_owner_name: string;
  shop_owner_business: string;
  shop_owner_id: number;
  product_name: string;
  product_sku: string;
  requested_quantity: number;
  fulfilled_quantity: number;
  actual_price: number;
  line_total: number;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  amount_paid: number;
  remaining_amount: number;
  order_date: string;
}

interface Summary {
  total_items: number;
  total_orders: number;
  total_qty: number;
  total_revenue: number;
  completed: number;
  pending: number;
  cancelled: number;
}

interface FranchiseOption {
  id: number;
  first_name: string;
  last_name: string;
  business_name: string | null;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  order_placed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  partially_fulfilled: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  delivery_in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  packing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  partial: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

export default function FranchiseReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [items, setItems] = useState<FranchiseItem[]>([]);
  const [franchises, setFranchises] = useState<FranchiseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number | "">("");
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const fetchReport = async (params?: {
    start_date?: string;
    end_date?: string;
    shop_owner_id?: number;
  }) => {
    setLoading(true);
    try {
      const data = await getUserFranchiseReportService(params);
      setSummary(data.summary);
      setItems(data.items);
      if (data.franchises) setFranchises(data.franchises);
    } catch (error) {
      console.error("Error fetching franchise report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = () => {
    const params: { start_date?: string; end_date?: string; shop_owner_id?: number } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedFranchiseId !== "") params.shop_owner_id = selectedFranchiseId;
    fetchReport(params);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSelectedFranchiseId("");
    fetchReport();
  };

  return (
    <div>
      <PageMeta
        title="Franchise Report | Xpilot"
        description="Stock sold to franchise owners"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
            Franchise Report
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Stock you fulfilled and sold to franchise owners
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Franchise</label>
            <select
              value={selectedFranchiseId}
              onChange={(e) => setSelectedFranchiseId(e.target.value === "" ? "" : Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">All franchises</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.first_name} {f.last_name}{f.business_name ? ` — ${f.business_name}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFilter}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_orders}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Items Fulfilled</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.total_items}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Qty Sent</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_qty}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₹{summary.total_revenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Completed: {summary.completed}
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                    Pending: {summary.pending}
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    Cancelled: {summary.cancelled}
                  </span>
                </div>
              </>
            )}

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No franchise orders found for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order #</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Franchise</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requested</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fulfilled</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price/Unit</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Line Total</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Status</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="py-3 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {items.map((item) => (
                      <>
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {item.order_number}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-gray-900 dark:text-gray-100">{item.shop_owner_name}</div>
                            {item.shop_owner_business && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{item.shop_owner_business}</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-gray-900 dark:text-gray-100">{item.product_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.product_sku}</div>
                          </td>
                          <td className="py-3 px-3 text-right text-gray-600 dark:text-gray-400">{item.requested_quantity}</td>
                          <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-gray-100">{item.fulfilled_quantity}</td>
                          <td className="py-3 px-3 text-right text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            ₹{item.actual_price.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                            ₹{item.line_total.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[item.order_status] || "bg-gray-100 text-gray-700"}`}>
                              {item.order_status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[item.payment_status] || "bg-gray-100 text-gray-700"}`}>
                              {item.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(item.order_date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                            >
                              {expandedItem === item.id ? "Hide" : "Payment"}
                            </button>
                          </td>
                        </tr>
                        {expandedItem === item.id && (
                          <tr key={`${item.id}-payment`} className="bg-gray-50 dark:bg-gray-800/30">
                            <td colSpan={11} className="px-6 py-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Payment Method</span>
                                  <p className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                                    {item.payment_method || "—"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Amount Paid</span>
                                  <p className="font-medium text-green-600 dark:text-green-400">
                                    ₹{item.amount_paid.toLocaleString("en-IN")}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Remaining</span>
                                  <p className="font-medium text-red-600 dark:text-red-400">
                                    ₹{item.remaining_amount.toLocaleString("en-IN")}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
