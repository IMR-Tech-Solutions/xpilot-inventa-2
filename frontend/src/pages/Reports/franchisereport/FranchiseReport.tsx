import { useState, useEffect } from "react";
import { getUserFranchiseReportService } from "./franchisereportservice";
import PageMeta from "../../../components/common/PageMeta";
import { downloadCSV, downloadPDF } from "../../../utils/downloadUtils";

interface FranchiseOrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  requested_quantity: number;
  fulfilled_quantity: number;
  actual_price: number;
  line_total: number;
}

interface FranchiseOrder {
  order_id: number;
  order_number: string;
  shop_owner_name: string;
  shop_owner_business: string;
  shop_owner_id: number;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  amount_paid: number;
  remaining_amount: number;
  total_qty: number;
  total_line_total: number;
  order_date: string;
  items: FranchiseOrderItem[];
}

interface Summary {
  total_orders: number;
  total_items: number;
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
  const [orders, setOrders] = useState<FranchiseOrder[]>([]);
  const [franchises, setFranchises] = useState<FranchiseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number | "">("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const fetchReport = async (params?: {
    start_date?: string;
    end_date?: string;
    shop_owner_id?: number;
  }) => {
    setLoading(true);
    try {
      const data = await getUserFranchiseReportService(params);
      setSummary(data.summary);
      setOrders(data.orders);
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
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
              Franchise Report
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Stock you fulfilled and sold to franchise owners
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            <button
              onClick={() =>
                downloadCSV(
                  orders,
                  [
                    { label: "Order #", key: "order_number" },
                    { label: "Franchise", key: "shop_owner_name" },
                    { label: "Business", key: "shop_owner_business" },
                    { label: "Total Qty", key: "total_qty" },
                    { label: "Total Value", key: "total_line_total" },
                    { label: "Order Status", key: "order_status" },
                    { label: "Payment Status", key: "payment_status" },
                    { label: "Paid", key: "amount_paid" },
                    { label: "Remaining", key: "remaining_amount" },
                    { label: "Date", key: "order_date" },
                  ],
                  "franchise-report"
                )
              }
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              CSV
            </button>
            <button
              onClick={() =>
                downloadPDF(
                  orders,
                  [
                    { label: "Order #", key: "order_number" },
                    { label: "Franchise", key: "shop_owner_name" },
                    { label: "Business", key: "shop_owner_business" },
                    { label: "Total Qty", key: "total_qty" },
                    { label: "Total Value", key: "total_line_total" },
                    { label: "Order Status", key: "order_status" },
                    { label: "Payment Status", key: "payment_status" },
                    { label: "Paid", key: "amount_paid" },
                    { label: "Remaining", key: "remaining_amount" },
                    { label: "Date", key: "order_date" },
                  ],
                  "franchise-report"
                )
              }
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              PDF
            </button>
          </div>
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
            {/* Summary */}
            {summary && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_orders}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Items Fulfilled</p>
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

            {/* Orders Table */}
            {orders.length === 0 ? (
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
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Qty</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Value</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Status</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paid</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remaining</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="py-3 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {orders.map((order) => (
                      <>
                        <tr
                          key={order.order_id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {order.order_number}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-gray-900 dark:text-gray-100">{order.shop_owner_name}</div>
                            {order.shop_owner_business && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{order.shop_owner_business}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                            {order.total_qty}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                            ₹{order.total_line_total.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.order_status] || "bg-gray-100 text-gray-700"}`}>
                              {order.order_status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.payment_status] || "bg-gray-100 text-gray-700"}`}>
                              {order.payment_status}
                            </span>
                            {order.payment_method && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{order.payment_method}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                            ₹{order.amount_paid.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                            ₹{order.remaining_amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(order.order_date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                            >
                              {expandedOrder === order.order_id ? "▲ Hide" : "▼ Products"}
                            </button>
                          </td>
                        </tr>
                        {expandedOrder === order.order_id && (
                          <tr key={`${order.order_id}-items`} className="bg-blue-50/40 dark:bg-blue-900/10">
                            <td colSpan={10} className="px-8 py-3">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Products in this order ({order.items.length})
                              </p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-1.5 pr-4">Product</th>
                                    <th className="text-right py-1.5 pr-4">Requested</th>
                                    <th className="text-right py-1.5 pr-4">Fulfilled</th>
                                    <th className="text-right py-1.5 pr-4">Price/Unit</th>
                                    <th className="text-right py-1.5">Line Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                  {order.items.map((item) => (
                                    <tr key={item.id}>
                                      <td className="py-1.5 pr-4">
                                        <div className="text-gray-800 dark:text-gray-200">{item.product_name}</div>
                                        <div className="text-gray-500 dark:text-gray-400">{item.product_sku}</div>
                                      </td>
                                      <td className="py-1.5 pr-4 text-right text-gray-500 dark:text-gray-400">{item.requested_quantity}</td>
                                      <td className="py-1.5 pr-4 text-right font-medium text-gray-800 dark:text-gray-200">{item.fulfilled_quantity}</td>
                                      <td className="py-1.5 pr-4 text-right text-gray-700 dark:text-gray-300">₹{item.actual_price.toLocaleString("en-IN")}</td>
                                      <td className="py-1.5 text-right font-semibold text-green-600 dark:text-green-400">₹{item.line_total.toLocaleString("en-IN")}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-300 uppercase" colSpan={2}>Total</td>
                      <td className="py-3 px-3 text-right text-gray-900 dark:text-white">
                        {orders.reduce((s, o) => s + o.total_qty, 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                        ₹{orders.reduce((s, o) => s + Number(o.total_line_total), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2} />
                      <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                        ₹{orders.reduce((s, o) => s + Number(o.amount_paid), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                        ₹{orders.reduce((s, o) => s + Number(o.remaining_amount), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
