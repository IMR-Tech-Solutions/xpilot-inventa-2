import { useState } from "react";
import { Table, Tag, Switch } from "antd";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getShopReceivableReportService } from "../../services/reportservices";
import { handleError } from "../../utils/handleError";

interface ShopReceivableRow {
  sr_no: number;
  shop_owner_name: string;
  shop_owner_phone: string;
  order_no: string;
  order_date: string;
  total_amount: number;
  collected: number;
  pending_amount: number;
  order_status: string;
  payment_status: string;
}

interface ShopOwnerGroup {
  shop_owner_name: string;
  total_amount: number;
  collected: number;
  pending: number;
  orders: ShopReceivableRow[];
}

interface Summary {
  total_orders: number;
  total_amount: number;
  collected: number;
  total_pending: number;
}

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(v);

const statusColor: Record<string, string> = {
  order_placed: "orange",
  partially_fulfilled: "blue",
  packing: "cyan",
  delivery_in_progress: "purple",
  completed: "green",
  cancelled: "red",
};

const ShopReceivableReport = () => {
  const [rows, setRows] = useState<ShopReceivableRow[]>([]);
  const [shopOwnerWise, setShopOwnerWise] = useState<ShopOwnerGroup[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [viewMode, setViewMode] = useState<"flat" | "grouped">("grouped");
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const today = () => new Date().toISOString().split("T")[0];
  const firstOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getShopReceivableReportService({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        only_pending: onlyPending,
      });
      setRows(res.rows || []);
      setShopOwnerWise(res.shop_owner_wise || []);
      setSummary(res.summary || null);
      setFetched(true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const flatColumns = [
    { title: "Sr No", dataIndex: "sr_no", key: "sr_no" },
    {
      title: "Shop Owner",
      dataIndex: "shop_owner_name",
      key: "shop_owner_name",
    },
    {
      title: "Phone",
      dataIndex: "shop_owner_phone",
      key: "shop_owner_phone",
    },
    { title: "Order No", dataIndex: "order_no", key: "order_no" },
    {
      title: "Order Date",
      dataIndex: "order_date",
      key: "order_date",
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Collected",
      dataIndex: "collected",
      key: "collected",
      align: "right" as const,
      render: (v: number) => (
        <span className="text-green-600">{formatINR(v)}</span>
      ),
    },
    {
      title: "Pending",
      dataIndex: "pending_amount",
      key: "pending_amount",
      align: "right" as const,
      render: (v: number) => (
        <span
          className={v > 0 ? "text-red-500 font-semibold" : "text-gray-400"}
        >
          {formatINR(v)}
        </span>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "order_status",
      key: "order_status",
      render: (v: string) => (
        <Tag color={statusColor[v] || "default"}>
          {v.replace(/_/g, " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Payment",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (v: string) => (
        <Tag color={v === "collected" ? "green" : "red"}>{v.toUpperCase()}</Tag>
      ),
    },
  ];

  const groupedColumns = [
    {
      title: "Shop Owner",
      dataIndex: "shop_owner_name",
      key: "shop_owner_name",
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Collected",
      dataIndex: "collected",
      key: "collected",
      align: "right" as const,
      render: (v: number) => (
        <span className="text-green-600 font-medium">{formatINR(v)}</span>
      ),
    },
    {
      title: "Pending",
      dataIndex: "pending",
      key: "pending",
      align: "right" as const,
      render: (v: number) => (
        <span
          className={v > 0 ? "text-red-500 font-semibold" : "text-gray-400"}
        >
          {formatINR(v)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="Shop Receivable Report"
        description="Shop Receivable Report — Amounts owed by Shop Owners"
      />
      <PageBreadcrumb pageTitle="Shop Receivable Report" />

      <ButtonComponentCard
        title="Shop Receivable Report"
        buttonlink=""
        buttontitle=""
      >
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              max={today()}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              max={today()}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Only Pending
            </label>
            <Switch
              checked={onlyPending}
              onChange={setOnlyPending}
              size="small"
            />
          </div>
          <button
            onClick={() => {
              setStartDate(today());
              setEndDate(today());
            }}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
          >
            Today
          </button>
          <button
            onClick={() => {
              setStartDate(firstOfMonth());
              setEndDate(today());
            }}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
          >
            This Month
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 dark:text-gray-400"
            >
              Clear
            </button>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              {
                label: "Total Orders",
                value: summary.total_orders,
                isNum: true,
              },
              { label: "Total Amount", value: summary.total_amount },
              { label: "Collected", value: summary.collected, green: true },
              {
                label: "Total Pending",
                value: summary.total_pending,
                red: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg p-3 ${item.red ? "bg-red-50 dark:bg-red-900/20" : item.green ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-800/50"}`}
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <p
                  className={`text-base font-semibold mt-1 ${item.red ? "text-red-500" : item.green ? "text-green-600" : "text-gray-800 dark:text-white"}`}
                >
                  {item.isNum
                    ? item.value.toLocaleString("en-IN")
                    : formatINR(item.value as number)}
                </p>
              </div>
            ))}
          </div>
        )}

        {fetched && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("grouped")}
              className={`px-3 py-1.5 text-xs rounded-md border ${viewMode === "grouped" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"}`}
            >
              Shop Owner Wise
            </button>
            <button
              onClick={() => setViewMode("flat")}
              className={`px-3 py-1.5 text-xs rounded-md border ${viewMode === "flat" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"}`}
            >
              All Orders
            </button>
          </div>
        )}

        {viewMode === "flat" ? (
          <Table
            columns={flatColumns}
            dataSource={rows}
            loading={loading}
            rowKey="sr_no"
            size="small"
            className="custom-orders-table"
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            locale={{
              emptyText: fetched
                ? "No records found."
                : "Click 'Generate Report' to load data.",
            }}
          />
        ) : (
          <Table
            columns={groupedColumns}
            dataSource={shopOwnerWise}
            loading={loading}
            rowKey="shop_owner_name"
            size="small"
            className="custom-orders-table"
            expandable={{
              expandedRowRender: (record: ShopOwnerGroup) => (
                <Table
                  columns={flatColumns.filter((c) => c.key !== "sr_no")}
                  dataSource={record.orders}
                  rowKey="order_no"
                  size="small"
                  pagination={false}
                  className="custom-orders-table"
                />
              ),
            }}
            pagination={false}
            locale={{
              emptyText: fetched
                ? "No records found."
                : "Click 'Generate Report' to load data.",
            }}
            summary={
              shopOwnerWise.length > 0 && summary
                ? () => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <strong>Grand Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <strong>{formatINR(summary.total_amount)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <strong className="text-green-600">
                          {formatINR(summary.collected)}
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <strong className="text-red-500">
                          {formatINR(summary.total_pending)}
                        </strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )
                : undefined
            }
          />
        )}
      </ButtonComponentCard>
    </>
  );
};

export default ShopReceivableReport;
