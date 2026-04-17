import { useState, useEffect } from "react";
import { Table, Drawer, Tag, Statistic, Select, Button } from "antd";
import { FilePdfOutlined, FileTextOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getAdminSalesReportService } from "./adminsalesreportservice";
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
  sold_by: string;
  sold_by_business: string;
  sold_by_id: number;
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

interface UserOption {
  id: number;
  first_name: string;
  last_name: string;
  business_name: string | null;
}

const orderStatusColor: Record<string, string> = {
  completed: "green",
  pending: "gold",
  cancelled: "red",
  confirmed: "blue",
  processing: "geekblue",
  ready: "purple",
};

const paymentStatusColor: Record<string, string> = {
  paid: "green",
  pending: "gold",
  partial: "orange",
  failed: "red",
  refunded: "purple",
};

export default function AdminSalesReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [drawerOrder, setDrawerOrder] = useState<SalesOrder | null>(null);

  const fetchReport = async (params?: {
    start_date?: string;
    end_date?: string;
    user_id?: number;
  }) => {
    setLoading(true);
    try {
      const data = await getAdminSalesReportService(params);
      setSummary(data.summary);
      setOrders(data.orders);
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching admin sales report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = () => {
    const params: { start_date?: string; end_date?: string; user_id?: number } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedUserId) params.user_id = selectedUserId;
    fetchReport(params);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSelectedUserId(undefined);
    fetchReport();
  };

  const columns: ColumnsType<SalesOrder> = [
    {
      title: "Order #",
      dataIndex: "order_number",
      key: "order_number",
      render: (val) => <span className="font-medium text-gray-900 dark:text-gray-100">{val}</span>,
    },
    {
      title: "Sold By",
      key: "sold_by",
      render: (_, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.sold_by}</div>
          {row.sold_by_business && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{row.sold_by_business}</div>
          )}
        </div>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">{row.customer_name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.customer_phone}</div>
        </div>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "order_status",
      key: "order_status",
      render: (val) => (
        <Tag color={orderStatusColor[val] || "default"} className="capitalize">
          {val}
        </Tag>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      render: (_, row) => (
        <div>
          <Tag color={paymentStatusColor[row.payment_status] || "default"} className="capitalize">
            {row.payment_status}
          </Tag>
          {row.payment_method && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{row.payment_method}</div>
          )}
        </div>
      ),
    },
    {
      title: "Total",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right",
      render: (val) => <span className="font-medium">₹{Number(val).toLocaleString("en-IN")}</span>,
    },
    {
      title: "Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      align: "right",
      render: (val) => <span className="text-green-600 dark:text-green-400">₹{Number(val).toLocaleString("en-IN")}</span>,
    },
    {
      title: "Remaining",
      dataIndex: "remaining_amount",
      key: "remaining_amount",
      align: "right",
      render: (val) => <span className="text-red-600 dark:text-red-400">₹{Number(val).toLocaleString("en-IN")}</span>,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (val) => new Date(val).toLocaleDateString("en-IN"),
    },
    {
      title: "",
      key: "action",
      render: (_, row) => (
        <button
          onClick={() => setDrawerOrder(row)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View
        </button>
      ),
    },
  ];

  const itemColumns: ColumnsType<OrderItem> = [
    { title: "Product", dataIndex: "product_name", key: "product_name" },
    { title: "Qty", dataIndex: "quantity", key: "quantity", align: "right" },
    {
      title: "Unit Price",
      dataIndex: "unit_price",
      key: "unit_price",
      align: "right",
      render: (val) => `₹${Number(val).toLocaleString("en-IN")}`,
    },
    {
      title: "Total",
      dataIndex: "total_price",
      key: "total_price",
      align: "right",
      render: (val) => <span className="font-medium">₹{Number(val).toLocaleString("en-IN")}</span>,
    },
  ];

  return (
    <div>
      <PageMeta
        title="Admin Sales Report | Xpilot"
        description="System-wide POS sales report"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
              Admin Sales Report
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              System-wide POS retail sales across all users
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            <Button
              icon={<FileTextOutlined />}
              onClick={() =>
                downloadCSV(
                  orders,
                  [
                    { label: "Order #", key: "order_number" },
                    { label: "Sold By", key: "sold_by" },
                    { label: "Business", key: "sold_by_business" },
                    { label: "Customer", key: "customer_name" },
                    { label: "Phone", key: "customer_phone" },
                    { label: "Order Status", key: "order_status" },
                    { label: "Payment Status", key: "payment_status" },
                    { label: "Total", key: "total_amount" },
                    { label: "Paid", key: "amount_paid" },
                    { label: "Remaining", key: "remaining_amount" },
                    { label: "Date", key: "created_at" },
                  ],
                  "admin-sales-report"
                )
              }
            >
              CSV
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              onClick={() =>
                downloadPDF(
                  orders,
                  [
                    { label: "Order #", key: "order_number" },
                    { label: "Sold By", key: "sold_by" },
                    { label: "Business", key: "sold_by_business" },
                    { label: "Customer", key: "customer_name" },
                    { label: "Phone", key: "customer_phone" },
                    { label: "Order Status", key: "order_status" },
                    { label: "Payment Status", key: "payment_status" },
                    { label: "Total", key: "total_amount" },
                    { label: "Paid", key: "amount_paid" },
                    { label: "Remaining", key: "remaining_amount" },
                    { label: "Date", key: "created_at" },
                  ],
                  "admin-sales-report",
                  {
                    title: "Admin Sales Report",
                    subtitle: "System-wide POS retail sales across all users",
                    dateRange: startDate && endDate
                      ? `${startDate} to ${endDate}`
                      : startDate ? `From ${startDate}` : endDate ? `To ${endDate}` : "All Dates",
                  }
                )
              }
            >
              PDF
            </Button>
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
            <label className="text-xs text-gray-500 dark:text-gray-400">Filter by User</label>
            <Select
              allowClear
              placeholder="All users"
              style={{ width: 220 }}
              value={selectedUserId}
              onChange={(val) => setSelectedUserId(val)}
              options={users.map((u) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name}${u.business_name ? ` (${u.business_name})` : ""}`,
              }))}
            />
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

        {/* Summary Cards */}
        {summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <Statistic
                  title={<span className="text-xs text-gray-500 dark:text-gray-400">Total Orders</span>}
                  value={summary.total_orders}
                />
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <Statistic
                  title={<span className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</span>}
                  value={summary.total_revenue}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: "#2563eb" }}
                />
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <Statistic
                  title={<span className="text-xs text-gray-500 dark:text-gray-400">Amount Paid</span>}
                  value={summary.total_paid}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: "#16a34a" }}
                />
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <Statistic
                  title={<span className="text-xs text-gray-500 dark:text-gray-400">Remaining</span>}
                  value={summary.total_remaining}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: "#dc2626" }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <Tag color="green">Completed: {summary.completed}</Tag>
              <Tag color="gold">Pending: {summary.pending}</Tag>
              <Tag color="red">Cancelled: {summary.cancelled}</Tag>
            </div>
          </>
        )}

        {/* Orders Table */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No sales orders found." }}
          summary={() => (
            <Table.Summary.Row className="font-semibold bg-gray-50 dark:bg-gray-800/50">
              <Table.Summary.Cell index={0} colSpan={5}>
                <span className="text-xs uppercase text-gray-500">Total</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <span className="font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  ₹{(summary?.total_revenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <span className="font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                  ₹{(summary?.total_paid ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                <span className="font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                  ₹{(summary?.total_remaining ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} />
              <Table.Summary.Cell index={9} />
            </Table.Summary.Row>
          )}
        />
      </div>

      {/* Order Detail Drawer */}
      <Drawer
        title={drawerOrder ? `Order: ${drawerOrder.order_number}` : "Order Details"}
        open={!!drawerOrder}
        onClose={() => setDrawerOrder(null)}
        width={600}
      >
        {drawerOrder && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Sold By</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{drawerOrder.sold_by}</p>
                {drawerOrder.sold_by_business && (
                  <p className="text-xs text-gray-500">{drawerOrder.sold_by_business}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Customer</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{drawerOrder.customer_name}</p>
                <p className="text-xs text-gray-500">{drawerOrder.customer_phone}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Order Status</p>
                <Tag color={orderStatusColor[drawerOrder.order_status] || "default"} className="capitalize">
                  {drawerOrder.order_status}
                </Tag>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Payment Status</p>
                <Tag color={paymentStatusColor[drawerOrder.payment_status] || "default"} className="capitalize">
                  {drawerOrder.payment_status}
                </Tag>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Payment Method</p>
                <p className="text-gray-800 dark:text-gray-200 capitalize">{drawerOrder.payment_method || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Date</p>
                <p className="text-gray-800 dark:text-gray-200">
                  {new Date(drawerOrder.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            {/* Financials */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span>₹{drawerOrder.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-100 dark:border-gray-700 pt-2">
                <span>Total</span>
                <span>₹{drawerOrder.total_amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Amount Paid</span>
                <span>₹{drawerOrder.amount_paid.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Remaining</span>
                <span>₹{drawerOrder.remaining_amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Items ({drawerOrder.items.length})
              </h4>
              <Table
                columns={itemColumns}
                dataSource={drawerOrder.items}
                rowKey="product_name"
                pagination={false}
                size="small"
              />
            </div>

            {drawerOrder.notes && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{drawerOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
