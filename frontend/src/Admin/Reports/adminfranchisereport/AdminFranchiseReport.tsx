import { useState, useEffect } from "react";
import { Table, Tag, Statistic, Select, Button } from "antd";
import { FilePdfOutlined, FileTextOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getAdminFranchiseReportService } from "./adminfranchisereportservice";
import PageMeta from "../../../components/common/PageMeta";
import { downloadCSV, downloadPDF } from "../../../utils/downloadUtils";

interface FranchiseOrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  fulfilled_by: string;
  fulfilled_by_id: number | null;
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
  total_items: number;
  total_orders: number;
  total_qty: number;
  total_revenue: number;
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
  order_placed: "blue",
  partially_fulfilled: "geekblue",
  delivery_in_progress: "purple",
  packing: "orange",
};

const paymentStatusColor: Record<string, string> = {
  paid: "green",
  pending: "gold",
  partial: "orange",
};

const itemColumns: ColumnsType<FranchiseOrderItem> = [
  {
    title: "Product",
    key: "product",
    render: (_, row) => (
      <div>
        <div className="text-sm text-gray-900 dark:text-gray-100">{row.product_name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{row.product_sku}</div>
      </div>
    ),
  },
  {
    title: "Fulfilled By",
    dataIndex: "fulfilled_by",
    key: "fulfilled_by",
    render: (val) => <span className="text-sm text-gray-800 dark:text-gray-200">{val || "—"}</span>,
  },
  {
    title: "Requested",
    dataIndex: "requested_quantity",
    key: "requested_quantity",
    align: "right",
    render: (val) => <span className="text-gray-500">{val}</span>,
  },
  {
    title: "Fulfilled",
    dataIndex: "fulfilled_quantity",
    key: "fulfilled_quantity",
    align: "right",
    render: (val) => <span className="font-medium">{val}</span>,
  },
  {
    title: "Price/Unit",
    dataIndex: "actual_price",
    key: "actual_price",
    align: "right",
    render: (val) => `₹${Number(val).toLocaleString("en-IN")}`,
  },
  {
    title: "Line Total",
    dataIndex: "line_total",
    key: "line_total",
    align: "right",
    render: (val) => (
      <span className="font-semibold text-green-600 dark:text-green-400">
        ₹{Number(val).toLocaleString("en-IN")}
      </span>
    ),
  },
];

export default function AdminFranchiseReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<FranchiseOrder[]>([]);
  const [managers, setManagers] = useState<UserOption[]>([]);
  const [franchises, setFranchises] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState<number | undefined>(undefined);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number | undefined>(undefined);

  const fetchReport = async (params?: {
    start_date?: string;
    end_date?: string;
    manager_id?: number;
    shop_owner_id?: number;
  }) => {
    setLoading(true);
    try {
      const data = await getAdminFranchiseReportService(params);
      setSummary(data.summary);
      setOrders(data.orders || []);
      if (data.managers) setManagers(data.managers);
      if (data.franchises) setFranchises(data.franchises);
    } catch (error) {
      console.error("Error fetching admin franchise report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = () => {
    const params: {
      start_date?: string;
      end_date?: string;
      manager_id?: number;
      shop_owner_id?: number;
    } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedManagerId) params.manager_id = selectedManagerId;
    if (selectedFranchiseId) params.shop_owner_id = selectedFranchiseId;
    fetchReport(params);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSelectedManagerId(undefined);
    setSelectedFranchiseId(undefined);
    fetchReport();
  };

  const columns: ColumnsType<FranchiseOrder> = [
    {
      title: "Order #",
      dataIndex: "order_number",
      key: "order_number",
      render: (val) => <span className="font-medium text-gray-900 dark:text-gray-100">{val}</span>,
    },
    {
      title: "Franchise",
      key: "franchise",
      render: (_, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.shop_owner_name}</div>
          {row.shop_owner_business && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{row.shop_owner_business}</div>
          )}
        </div>
      ),
    },
    {
      title: "Total Qty",
      dataIndex: "total_qty",
      key: "total_qty",
      align: "right",
      render: (val) => <span className="font-medium">{val}</span>,
    },
    {
      title: "Total Value",
      dataIndex: "total_line_total",
      key: "total_line_total",
      align: "right",
      render: (val) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          ₹{Number(val).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "order_status",
      key: "order_status",
      render: (val) => (
        <Tag color={orderStatusColor[val] || "default"} className="capitalize">
          {val.replace(/_/g, " ")}
        </Tag>
      ),
    },
    {
      title: "Payment",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (val) => (
        <Tag color={paymentStatusColor[val] || "default"} className="capitalize">
          {val}
        </Tag>
      ),
    },
    {
      title: "Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      align: "right",
      render: (val) => (
        <span className="text-green-600 dark:text-green-400">
          ₹{Number(val).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      title: "Remaining",
      dataIndex: "remaining_amount",
      key: "remaining_amount",
      align: "right",
      render: (val) => (
        <span className={Number(val) > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400"}>
          ₹{Number(val).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "order_date",
      key: "order_date",
      render: (val) => new Date(val).toLocaleDateString("en-IN"),
    },
  ];

  return (
    <div>
      <PageMeta
        title="Admin Franchise Report | Xpilot"
        description="System-wide franchise sales report"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
              Admin Franchise Report
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              System-wide stock sold from managers to franchise owners
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
                  "admin-franchise-report"
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
                  "admin-franchise-report"
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
            <label className="text-xs text-gray-500 dark:text-gray-400">Filter by Manager</label>
            <Select
              allowClear
              placeholder="All managers"
              style={{ width: 210 }}
              value={selectedManagerId}
              onChange={(val) => setSelectedManagerId(val)}
              options={managers.map((m) => ({
                value: m.id,
                label: `${m.first_name} ${m.last_name}${m.business_name ? ` (${m.business_name})` : ""}`,
              }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Filter by Franchise</label>
            <Select
              allowClear
              placeholder="All franchises"
              style={{ width: 210 }}
              value={selectedFranchiseId}
              onChange={(val) => setSelectedFranchiseId(val)}
              options={franchises.map((f) => ({
                value: f.id,
                label: `${f.first_name} ${f.last_name}${f.business_name ? ` (${f.business_name})` : ""}`,
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <Statistic
                  title={<span className="text-xs text-gray-500 dark:text-gray-400">Total Orders</span>}
                  value={summary.total_orders}
                />
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <Statistic
                  title={<span className="text-xs text-gray-500 dark:text-gray-400">Items Fulfilled</span>}
                  value={summary.total_items}
                  valueStyle={{ color: "#2563eb" }}
                />
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <Statistic
                  title={<span className="text-xs text-gray-500 dark:text-gray-400">Total Qty Sent</span>}
                  value={summary.total_qty}
                />
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <Statistic
                  title={<span className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</span>}
                  value={summary.total_revenue}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: "#16a34a" }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-8">
              <Tag color="green">Completed: {summary.completed}</Tag>
              <Tag color="gold">Pending: {summary.pending}</Tag>
              <Tag color="red">Cancelled: {summary.cancelled}</Tag>
            </div>
          </>
        )}

        {/* Orders Table with Expandable Product Rows */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="order_id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No franchise orders found." }}
          expandable={{
            expandedRowRender: (order) => (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Products in {order.order_number}
                </p>
                <Table
                  columns={itemColumns}
                  dataSource={order.items}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: "max-content" }}
                />
              </div>
            ),
            rowExpandable: (order) => order.items && order.items.length > 0,
          }}
        />
      </div>
    </div>
  );
}
