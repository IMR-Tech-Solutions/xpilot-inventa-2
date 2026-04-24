import React, { useState, useEffect } from "react";
import { getS2SReportService } from "./s2sreportservice";
import PageMeta from "../../../components/common/PageMeta";
import { downloadCSV, downloadPDF } from "../../../utils/downloadUtils";

interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  requested_quantity: number;
  fulfilled_quantity: number | null;
  actual_price: number;
  line_total: number;
  item_status: string;
}

interface S2SOrder {
  order_id: number;
  order_number: string;
  counterpart_name: string;
  counterpart_business: string;
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
  total_value: number;
  total_paid: number;
  total_remaining: number;
  completed: number;
  pending: number;
  cancelled: number;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  order_placed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  partially_accepted: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  accepted: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  packing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  delivery_in_progress: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  partial: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

export default function S2SReport() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<S2SOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const fetchReport = async (params?: { start_date?: string; end_date?: string; role?: "buyer" | "seller" }) => {
    setLoading(true);
    try {
      const data = await getS2SReportService(params);
      setSummary(data.summary);
      setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching S2S report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport({ role }); }, [role]);

  const handleFilter = () => {
    const params: any = { role };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    fetchReport(params);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    fetchReport({ role });
  };

  const counterpartLabel = role === "buyer" ? "Seller Shop" : "Buyer Shop";
  const dateRange = startDate && endDate ? `${startDate} to ${endDate}` : startDate ? `From ${startDate}` : endDate ? `To ${endDate}` : "All Dates";

  const flatRows = orders.flatMap((o) =>
    o.items.map((item) => ({
      order_number: o.order_number,
      order_date: o.order_date,
      counterpart: `${o.counterpart_name}${o.counterpart_business ? ` (${o.counterpart_business})` : ""}`,
      product_name: item.product_name,
      product_sku: item.product_sku,
      requested_quantity: item.requested_quantity,
      fulfilled_quantity: item.fulfilled_quantity ?? 0,
      actual_price: item.actual_price,
      line_total: item.line_total,
      item_status: item.item_status,
      order_status: o.order_status,
      payment_status: o.payment_status,
      amount_paid: o.amount_paid,
      remaining_amount: o.remaining_amount,
    }))
  );

  const exportColumns = [
    { label: "Order #", key: "order_number" },
    { label: "Order Date", key: "order_date" },
    { label: counterpartLabel, key: "counterpart" },
    { label: "Product", key: "product_name" },
    { label: "SKU", key: "product_sku" },
    { label: "Requested Qty", key: "requested_quantity" },
    { label: "Fulfilled Qty", key: "fulfilled_quantity" },
    { label: "Price/Unit", key: "actual_price" },
    { label: "Line Total", key: "line_total" },
    { label: "Item Status", key: "item_status" },
    { label: "Order Status", key: "order_status" },
    { label: "Payment", key: "payment_status" },
    { label: "Paid", key: "amount_paid" },
    { label: "Remaining", key: "remaining_amount" },
  ];

  return (
    <div>
      <PageMeta title="S2S Report | Xpilot" description="Shop-to-shop order report" />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
              Shop-to-Shop Report
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track all S2S orders — as buyer or as seller
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            <button onClick={() => downloadCSV(flatRows, exportColumns, "s2s-report")}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              CSV
            </button>
            <button onClick={() => downloadPDF(flatRows, exportColumns, "s2s-report", { title: "Shop-to-Shop Report", subtitle: `${role === "buyer" ? "Orders placed to other shops" : "Orders received from other shops"} — ${dateRange}`, dateRange })}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              PDF
            </button>
          </div>
        </div>

        {/* Role toggle */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setRole("buyer")}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${role === "buyer" ? "bg-blue-600 text-white" : "border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
            As Buyer
          </button>
          <button onClick={() => setRole("seller")}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${role === "seller" ? "bg-blue-600 text-white" : "border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
            As Seller
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleFilter}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Apply</button>
            <button onClick={handleClear}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Clear</button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {summary && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_orders}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Qty</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.total_qty}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{role === "buyer" ? "Total Spent" : "Total Revenue"}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.total_value.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining Due</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹{summary.total_remaining.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount Paid</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">₹{summary.total_paid.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Items Exchanged</p>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{summary.total_items}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Completed: {summary.completed}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Pending: {summary.pending}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Cancelled: {summary.cancelled}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No S2S orders found for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Order #</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{counterpartLabel}</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Order Date</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Qty</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Value</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
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
                          <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{order.order_number}</td>
                          <td className="py-3 px-3">
                            <div className="text-gray-900 dark:text-gray-100 font-medium">{order.counterpart_business || order.counterpart_name}</div>
                            {order.counterpart_business && <div className="text-xs text-gray-400">{order.counterpart_name}</div>}
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{new Date(order.order_date).toLocaleDateString("en-IN")}</td>
                          <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-gray-100">{order.total_qty}</td>
                          <td className="py-3 px-3 text-right font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">₹{order.total_value.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.order_status] || "bg-gray-100 text-gray-700"}`}>
                              {order.order_status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.payment_status] || "bg-gray-100 text-gray-700"}`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">₹{order.amount_paid.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">₹{order.remaining_amount.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-3">
                            <button onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
                              {expandedOrder === order.order_id ? "▲ Hide" : "▼ Items"}
                            </button>
                          </td>
                        </tr>

                        {expandedOrder === order.order_id && (
                          <tr key={`${order.order_id}-items`} className="bg-blue-50/40 dark:bg-blue-900/10">
                            <td colSpan={10} className="px-8 py-3">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Items ({order.items.length})</p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-1.5 pr-4">Product</th>
                                    <th className="text-right py-1.5 pr-4">Requested</th>
                                    <th className="text-right py-1.5 pr-4">Fulfilled</th>
                                    <th className="text-right py-1.5 pr-4">Price/Unit</th>
                                    <th className="text-right py-1.5 pr-4">Line Total</th>
                                    <th className="text-left py-1.5">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                  {order.items.map((item) => (
                                    <tr key={item.id}>
                                      <td className="py-1.5 pr-4">
                                        <div className="text-gray-800 dark:text-gray-200 font-medium">{item.product_name}</div>
                                        <div className="text-gray-400">{item.product_sku}</div>
                                      </td>
                                      <td className="py-1.5 pr-4 text-right text-gray-500 dark:text-gray-400">{item.requested_quantity}</td>
                                      <td className="py-1.5 pr-4 text-right font-medium text-gray-800 dark:text-gray-200">{item.fulfilled_quantity ?? "—"}</td>
                                      <td className="py-1.5 pr-4 text-right text-gray-700 dark:text-gray-300">₹{item.actual_price.toLocaleString("en-IN")}</td>
                                      <td className="py-1.5 pr-4 text-right font-semibold text-blue-600 dark:text-blue-400">₹{item.line_total.toLocaleString("en-IN")}</td>
                                      <td className="py-1.5">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${item.item_status === "accepted" ? "bg-green-100 text-green-800" : item.item_status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                                          {item.item_status}
                                        </span>
                                      </td>
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
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-300 uppercase" colSpan={3}>Total</td>
                      <td className="py-3 px-3 text-right text-gray-900 dark:text-white">{orders.reduce((s, o) => s + o.total_qty, 0)}</td>
                      <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">₹{orders.reduce((s, o) => s + Number(o.total_value), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td colSpan={2} />
                      <td className="py-3 px-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">₹{orders.reduce((s, o) => s + Number(o.amount_paid), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">₹{orders.reduce((s, o) => s + Number(o.remaining_amount), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
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
