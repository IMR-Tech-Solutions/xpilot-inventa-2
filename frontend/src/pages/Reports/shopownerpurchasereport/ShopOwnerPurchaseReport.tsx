import React, { useState, useEffect } from "react";
import { getShopOwnerPurchaseReportService } from "./shopownerpurchasereportservice";
import PageMeta from "../../../components/common/PageMeta";
import { downloadCSV, downloadPDF } from "../../../utils/downloadUtils";

interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  requested_quantity: number;
  fulfilled_quantity: number;
  actual_price: number;
  line_total: number;
  fulfilled_by: string;
  fulfilled_by_id: number | null;
  fulfilled_by_business: string;
}

interface PurchaseOrder {
  order_id: number;
  order_number: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  amount_paid: number;
  remaining_amount: number;
  total_qty: number;
  total_value: number;
  order_date: string;
  items: OrderItem[];
}

interface Summary {
  total_orders: number;
  total_items: number;
  total_qty: number;
  total_spent: number;
  total_paid: number;
  total_remaining: number;
  completed: number;
  pending: number;
  cancelled: number;
}

interface ManagerOption {
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

export default function ShopOwnerPurchaseReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState<number | "">("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const fetchReport = async (params?: {
    start_date?: string;
    end_date?: string;
    manager_id?: number;
  }) => {
    setLoading(true);
    try {
      const data = await getShopOwnerPurchaseReportService(params);
      setSummary(data.summary);
      setOrders(data.orders);
      if (data.managers) setManagers(data.managers);
    } catch (error) {
      console.error("Error fetching shop owner purchase report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = () => {
    const params: { start_date?: string; end_date?: string; manager_id?: number } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedManagerId !== "") params.manager_id = selectedManagerId;
    fetchReport(params);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSelectedManagerId("");
    fetchReport();
  };

  const dateRange = startDate && endDate
    ? `${startDate} to ${endDate}`
    : startDate ? `From ${startDate}` : endDate ? `To ${endDate}` : "All Dates";

  // Flat rows for CSV/PDF (one row per item)
  const flatRows = orders.flatMap((order) =>
    order.items.map((item) => ({
      order_number: order.order_number,
      order_date: order.order_date,
      fulfilled_by: item.fulfilled_by,
      fulfilled_by_business: item.fulfilled_by_business,
      product_name: item.product_name,
      product_sku: item.product_sku,
      requested_quantity: item.requested_quantity,
      fulfilled_quantity: item.fulfilled_quantity,
      actual_price: item.actual_price,
      line_total: item.line_total,
      order_status: order.order_status,
      payment_status: order.payment_status,
      amount_paid: order.amount_paid,
      remaining_amount: order.remaining_amount,
    }))
  );

  const exportColumns = [
    { label: "Order #", key: "order_number" },
    { label: "Order Date", key: "order_date" },
    { label: "Fulfilled By", key: "fulfilled_by" },
    { label: "Business", key: "fulfilled_by_business" },
    { label: "Product", key: "product_name" },
    { label: "SKU", key: "product_sku" },
    { label: "Requested Qty", key: "requested_quantity" },
    { label: "Fulfilled Qty", key: "fulfilled_quantity" },
    { label: "Price/Unit", key: "actual_price" },
    { label: "Line Total", key: "line_total" },
    { label: "Order Status", key: "order_status" },
    { label: "Payment Status", key: "payment_status" },
    { label: "Amount Paid", key: "amount_paid" },
    { label: "Remaining", key: "remaining_amount" },
  ];

  return (
    <div>
      <PageMeta
        title="Purchase Report | Xpilot"
        description="View your stock purchase history from managers"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
              Purchase Report
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Stock you purchased from managers — order and item breakdown
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            <button
              onClick={() => downloadCSV(flatRows, exportColumns, "shopowner-purchase-report")}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              CSV
            </button>
            <button
              onClick={() =>
                downloadPDF(flatRows, exportColumns, "shopowner-purchase-report", {
                  title: "Purchase Report",
                  subtitle: "Stock purchased from managers — order and item breakdown",
                  dateRange,
                })
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
            <label className="text-xs text-gray-500 dark:text-gray-400">Manager</label>
            <select
              value={selectedManagerId}
              onChange={(e) =>
                setSelectedManagerId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">All managers</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name}
                  {m.business_name ? ` — ${m.business_name}` : ""}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Qty Purchased</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.total_qty}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{summary.total_spent.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining Due</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ₹{summary.total_remaining.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount Paid</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ₹{summary.total_paid.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Items Fulfilled</p>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{summary.total_items}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Completed: {summary.completed}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Pending: {summary.pending}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        Cancelled: {summary.cancelled}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Orders Table */}
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No purchase orders found for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Order #</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Order Date</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total Qty</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Total Value</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Order Status</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Payment</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Paid</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Remaining</th>
                      <th className="py-3 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {orders.map((order) => (
                      <React.Fragment key={order.order_id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {order.order_number}
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(order.order_date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                            {order.total_qty}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            ₹{order.total_value.toLocaleString("en-IN")}
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
                              <div className="text-xs text-gray-400 mt-0.5 capitalize">{order.payment_method}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                            ₹{order.amount_paid.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                            ₹{order.remaining_amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() =>
                                setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)
                              }
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                            >
                              {expandedOrder === order.order_id ? "▲ Hide" : "▼ Items"}
                            </button>
                          </td>
                        </tr>

                        {expandedOrder === order.order_id && (
                          <tr key={`${order.order_id}-items`} className="bg-blue-50/40 dark:bg-blue-900/10">
                            <td colSpan={9} className="px-8 py-3">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Items in this order ({order.items.length})
                              </p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-1.5 pr-4">Product</th>
                                    <th className="text-left py-1.5 pr-4">Fulfilled By</th>
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
                                        <div className="text-gray-800 dark:text-gray-200 font-medium">{item.product_name}</div>
                                        <div className="text-gray-400">{item.product_sku}</div>
                                      </td>
                                      <td className="py-1.5 pr-4">
                                        <div className="text-gray-800 dark:text-gray-200">{item.fulfilled_by}</div>
                                        {item.fulfilled_by_business && (
                                          <div className="text-gray-400">{item.fulfilled_by_business}</div>
                                        )}
                                      </td>
                                      <td className="py-1.5 pr-4 text-right text-gray-500 dark:text-gray-400">{item.requested_quantity}</td>
                                      <td className="py-1.5 pr-4 text-right font-medium text-gray-800 dark:text-gray-200">{item.fulfilled_quantity}</td>
                                      <td className="py-1.5 pr-4 text-right text-gray-700 dark:text-gray-300">₹{item.actual_price.toLocaleString("en-IN")}</td>
                                      <td className="py-1.5 text-right font-semibold text-blue-600 dark:text-blue-400">₹{item.line_total.toLocaleString("en-IN")}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-300 uppercase" colSpan={2}>Total</td>
                      <td className="py-3 px-3 text-right text-gray-900 dark:text-white">
                        {orders.reduce((s, o) => s + o.total_qty, 0)}
                      </td>
                      <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        ₹{orders.reduce((s, o) => s + Number(o.total_value), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2} />
                      <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                        ₹{orders.reduce((s, o) => s + Number(o.amount_paid), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                        ₹{orders.reduce((s, o) => s + Number(o.remaining_amount), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td />
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
