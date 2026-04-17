import React, { useState, useEffect } from "react";
import { getUserSalesReportService } from "./salesreportservice";
import PageMeta from "../../../components/common/PageMeta";
import { downloadCSV, downloadPDF } from "../../../utils/downloadUtils";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface SalesOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  total_amount: number;
  amount_paid: number;
  remaining_amount: number;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

interface Summary {
  total_orders: number;
  total_revenue: number;
  total_paid: number;
  total_remaining: number;
  completed: number;
  pending: number;
  cancelled: number;
}

interface CustomerOption {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  ready: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  partial: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function SalesReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const fetchReport = async (params?: { start_date?: string; end_date?: string; customer_id?: number }) => {
    setLoading(true);
    try {
      const data = await getUserSalesReportService(params);
      setSummary(data.summary);
      setOrders(data.orders);
      if (data.customers) setCustomers(data.customers);
    } catch (error) {
      console.error("Error fetching sales report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = () => {
    const params: { start_date?: string; end_date?: string; customer_id?: number } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedCustomerId !== "") params.customer_id = selectedCustomerId;
    fetchReport(params);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSelectedCustomerId("");
    fetchReport();
  };

  return (
    <div>
      <PageMeta
        title="Sales Report | Xpilot"
        description="View your POS sales report"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
              Sales Report
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your POS retail sales overview
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            <button
              onClick={() =>
                downloadCSV(
                  orders,
                  [
                    { label: "Order #", key: "order_number" },
                    { label: "Customer", key: "customer_name" },
                    { label: "Phone", key: "customer_phone" },
                    { label: "Order Status", key: "order_status" },
                    { label: "Payment Status", key: "payment_status" },
                    { label: "Total", key: "total_amount" },
                    { label: "Paid", key: "amount_paid" },
                    { label: "Remaining", key: "remaining_amount" },
                    { label: "Date", key: "created_at" },
                  ],
                  "sales-report"
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
                    { label: "Customer", key: "customer_name" },
                    { label: "Phone", key: "customer_phone" },
                    { label: "Order Status", key: "order_status" },
                    { label: "Payment Status", key: "payment_status" },
                    { label: "Total", key: "total_amount" },
                    { label: "Paid", key: "amount_paid" },
                    { label: "Remaining", key: "remaining_amount" },
                    { label: "Date", key: "created_at" },
                  ],
                  "sales-report",
                  {
                    title: "Sales Report",
                    subtitle: "POS retail sales overview",
                    dateRange: startDate && endDate
                      ? `${startDate} to ${endDate}`
                      : startDate ? `From ${startDate}` : endDate ? `To ${endDate}` : "All Dates",
                  }
                )
              }
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              PDF
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
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
            <label className="text-xs text-gray-500 dark:text-gray-400">Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value === "" ? "" : Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
            >
              <option value="">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} — {c.phone}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_orders}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{summary.total_revenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₹{summary.total_paid.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ₹{summary.total_remaining.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Status badges */}
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
                No sales orders found for the selected period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order #</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paid</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remaining</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="py-3 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {orders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {order.order_number}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-gray-900 dark:text-gray-100">{order.customer_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{order.customer_phone}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.order_status] || "bg-gray-100 text-gray-700"}`}>
                              {order.order_status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.payment_status] || "bg-gray-100 text-gray-700"}`}>
                              {order.payment_status}
                            </span>
                            {order.payment_method && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{order.payment_method}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            ₹{order.total_amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                            ₹{order.amount_paid.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                            ₹{order.remaining_amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() =>
                                setExpandedOrder(expandedOrder === order.id ? null : order.id)
                              }
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                            >
                              {expandedOrder === order.id ? "Hide" : "Items"}
                            </button>
                          </td>
                        </tr>
                        {expandedOrder === order.id && (
                          <tr className="bg-gray-50 dark:bg-gray-800/30">
                            <td colSpan={9} className="px-6 py-3">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500 dark:text-gray-400">
                                    <th className="text-left py-1 pr-4">Product</th>
                                    <th className="text-right py-1 pr-4">Qty</th>
                                    <th className="text-right py-1 pr-4">Unit Price</th>
                                    <th className="text-right py-1">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                  {order.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="py-1.5 pr-4 text-gray-800 dark:text-gray-200">{item.product_name}</td>
                                      <td className="py-1.5 pr-4 text-right text-gray-700 dark:text-gray-300">{item.quantity}</td>
                                      <td className="py-1.5 pr-4 text-right text-gray-700 dark:text-gray-300">₹{item.unit_price.toLocaleString("en-IN")}</td>
                                      <td className="py-1.5 text-right font-medium text-gray-900 dark:text-gray-100">₹{item.total_price.toLocaleString("en-IN")}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {order.notes && (
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  Notes: {order.notes}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-300 uppercase" colSpan={4}>Total</td>
                      <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        ₹{(summary?.total_revenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                        ₹{(summary?.total_paid ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                        ₹{(summary?.total_remaining ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
