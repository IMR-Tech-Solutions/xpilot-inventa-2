import { useState, useEffect } from "react";
import { Table, Drawer, Tag, Statistic, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getAdminFranchiseReportService } from "./adminfranchisereportservice";
import PageMeta from "../../../components/common/PageMeta";

interface FranchiseItem {
  id: number;
  order_number: string;
  order_id: number;
  fulfilled_by: string;
  fulfilled_by_id: number | null;
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

export default function AdminFranchiseReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [items, setItems] = useState<FranchiseItem[]>([]);
  const [managers, setManagers] = useState<UserOption[]>([]);
  const [franchises, setFranchises] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState<number | undefined>(undefined);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number | undefined>(undefined);
  const [drawerItem, setDrawerItem] = useState<FranchiseItem | null>(null);

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
      setItems(data.items);
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

  const columns: ColumnsType<FranchiseItem> = [
    {
      title: "Order #",
      dataIndex: "order_number",
      key: "order_number",
      render: (val) => <span className="font-medium text-gray-900 dark:text-gray-100">{val}</span>,
    },
    {
      title: "Fulfilled By",
      dataIndex: "fulfilled_by",
      key: "fulfilled_by",
      render: (val) => <span className="text-sm text-gray-800 dark:text-gray-200">{val}</span>,
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
      title: "Date",
      dataIndex: "order_date",
      key: "order_date",
      render: (val) => new Date(val).toLocaleDateString("en-IN"),
    },
    {
      title: "",
      key: "action",
      render: (_, row) => (
        <button
          onClick={() => setDrawerItem(row)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View
        </button>
      ),
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
        <div className="mb-8">
          <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
            Admin Franchise Report
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            System-wide stock sold from managers to franchise owners
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

        {/* Items Table */}
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No franchise orders found." }}
        />
      </div>

      {/* Detail Drawer */}
      <Drawer
        title={drawerItem ? `${drawerItem.order_number} — ${drawerItem.product_name}` : "Item Details"}
        open={!!drawerItem}
        onClose={() => setDrawerItem(null)}
        width={520}
      >
        {drawerItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Product</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{drawerItem.product_name}</p>
                <p className="text-xs text-gray-500">{drawerItem.product_sku}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Fulfilled By</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{drawerItem.fulfilled_by}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Franchise</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{drawerItem.shop_owner_name}</p>
                {drawerItem.shop_owner_business && (
                  <p className="text-xs text-gray-500">{drawerItem.shop_owner_business}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Date</p>
                <p className="text-gray-800 dark:text-gray-200">
                  {new Date(drawerItem.order_date).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Order Status</p>
                <Tag color={orderStatusColor[drawerItem.order_status] || "default"} className="capitalize">
                  {drawerItem.order_status.replace(/_/g, " ")}
                </Tag>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Payment Status</p>
                <Tag color={paymentStatusColor[drawerItem.payment_status] || "default"} className="capitalize">
                  {drawerItem.payment_status}
                </Tag>
              </div>
            </div>

            {/* Quantity & Pricing */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Quantity & Pricing</p>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Requested Qty</span>
                <span>{drawerItem.requested_quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Fulfilled Qty</span>
                <span className="font-medium">{drawerItem.fulfilled_quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Price per Unit</span>
                <span>₹{drawerItem.actual_price.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-100 dark:border-gray-700 pt-2 text-green-600 dark:text-green-400">
                <span>Line Total</span>
                <span>₹{drawerItem.line_total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Payment Details</p>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Method</span>
                <span className="capitalize">{drawerItem.payment_method || "—"}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Amount Paid</span>
                <span>₹{drawerItem.amount_paid.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Remaining</span>
                <span>₹{drawerItem.remaining_amount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
