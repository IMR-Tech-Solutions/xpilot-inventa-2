import { useState } from "react";
import { Table, Tag } from "antd";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getInventoryReportService } from "../../services/reportservices";
import { handleError } from "../../utils/handleError";

interface InventoryRow {
  sr_no: number;
  date: string;
  product_name: string;
  type: string;
  voucher_no: string;
  in_qty: number;
  in_rate: number;
  in_amount: number;
  out_qty: number;
  out_rate: number;
  out_amount: number;
  closing_qty: number;
  closing_rate: number;
  closing_amount: number;
}

interface Summary {
  total_transactions: number;
  total_inward_qty: number;
  total_inward_value: number;
  total_outward_qty: number;
  total_outward_value: number;
}

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(v);

const InventoryReport = () => {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
      const res = await getInventoryReportService({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setRows(res.rows || []);
      setSummary(res.summary || null);
      setFetched(true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Sr No", dataIndex: "sr_no", key: "sr_no"},
    { title: "Date", dataIndex: "date", key: "date"},
    { title: "Product Name", dataIndex: "product_name", key: "product_name" },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (v: string) => (
        <Tag color={v === "Purchase" ? "blue" : "green"}>{v}</Tag>
      ),
    },
    {
      title: "Voucher No",
      dataIndex: "voucher_no",
      key: "voucher_no",
    },
    // Inward
    {
      title: "In Qty",
      dataIndex: "in_qty",
      key: "in_qty",
      align: "right" as const,
      render: (v: number) => (v > 0 ? v : "-"),
    },
    {
      title: "In Rate",
      dataIndex: "in_rate",
      key: "in_rate",
      align: "right" as const,
      render: (v: number) => (v > 0 ? formatINR(v) : "-"),
    },
    {
      title: "In Amount",
      dataIndex: "in_amount",
      key: "in_amount",
      align: "right" as const,
      render: (v: number) => (v > 0 ? formatINR(v) : "-"),
    },
    // Outward
    {
      title: "Out Qty",
      dataIndex: "out_qty",
      key: "out_qty",
      align: "right" as const,
      render: (v: number) => (v > 0 ? v : "-"),
    },
    {
      title: "Out Rate",
      dataIndex: "out_rate",
      key: "out_rate",
      align: "right" as const,
      render: (v: number) => (v > 0 ? formatINR(v) : "-"),
    },
    {
      title: "Out Amount",
      dataIndex: "out_amount",
      key: "out_amount",
      align: "right" as const,
      render: (v: number) => (v > 0 ? formatINR(v) : "-"),
    },
    // Closing
    {
      title: "Closing Qty",
      dataIndex: "closing_qty",
      key: "closing_qty",
      align: "right" as const,
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: "Closing Rate",
      dataIndex: "closing_rate",
      key: "closing_rate",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Closing Amount",
      dataIndex: "closing_amount",
      key: "closing_amount",
      align: "right" as const,
      render: (v: number) => <strong>{formatINR(v)}</strong>,
    },
  ];

  return (
    <>
      <PageMeta title="Inventory Report" description="Inventory Report" />
      <PageBreadcrumb pageTitle="Inventory Report" />

      <ButtonComponentCard
        title="Inventory Report"
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
            {[
              {
                label: "Total Transactions",
                value: summary.total_transactions,
                isNum: true,
              },
              {
                label: "Total Inward Qty",
                value: summary.total_inward_qty,
                isNum: true,
              },
              {
                label: "Total Inward Value",
                value: summary.total_inward_value,
              },
              {
                label: "Total Outward Qty",
                value: summary.total_outward_qty,
                isNum: true,
              },
              {
                label: "Total Outward Value",
                value: summary.total_outward_value,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <p className="text-base font-semibold text-gray-800 dark:text-white mt-1">
                  {item.isNum
                    ? Number(item.value).toLocaleString("en-IN")
                    : formatINR(item.value as number)}
                </p>
              </div>
            ))}
          </div>
        )}

        <Table
          columns={columns}
          dataSource={rows}
          loading={loading}
          rowKey="sr_no"
          size="small"
          className="custom-orders-table"
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          locale={{
            emptyText: fetched
              ? "No records found."
              : "Click 'Generate Report' to load data.",
          }}
        />
      </ButtonComponentCard>
    </>
  );
};

export default InventoryReport;
