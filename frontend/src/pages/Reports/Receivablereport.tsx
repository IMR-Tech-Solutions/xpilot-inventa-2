import { useState } from "react";
import { Table, Tag, Switch } from "antd";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getReceivableReportService } from "../../services/reportservices";
import { handleError } from "../../utils/handleError";

interface ReceivableRow {
  sr_no: number;
  customer_name: string;
  invoice_date: string;
  invoice_no: string;
  invoice_amount: number;
  receipts: number;
  pending_amount: number;
  payment_status: string;
  payment_method: string;
}

interface CustomerGroup {
  customer_name: string;
  total_invoice: number;
  total_receipts: number;
  total_pending: number;
  invoices: ReceivableRow[];
}

interface Summary {
  total_invoices: number;
  total_invoice_amt: number;
  total_receipts: number;
  total_pending: number;
}

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(v);

const ReceivableReport = () => {
  const [rows, setRows] = useState<ReceivableRow[]>([]);
  const [customerWise, setCustomerWise] = useState<CustomerGroup[]>([]);
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
      const res = await getReceivableReportService({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        only_pending: onlyPending,
      });
      setRows(res.rows || []);
      setCustomerWise(res.customer_wise || []);
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
      title: "Customer Name",
      dataIndex: "customer_name",
      key: "customer_name",
    },
    {
      title: "Invoice Date",
      dataIndex: "invoice_date",
      key: "invoice_date",
    },
    {
      title: "Invoice No",
      dataIndex: "invoice_no",
      key: "invoice_no",
    },
    {
      title: "Invoice Amount",
      dataIndex: "invoice_amount",
      key: "invoice_amount",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Receipts",
      dataIndex: "receipts",
      key: "receipts",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Pending Amount",
      dataIndex: "pending_amount",
      key: "pending_amount",
      align: "right" as const,
      render: (v: number) => (
        <span
          className={v > 0 ? "text-red-500 font-semibold" : "text-green-600"}
        >
          {formatINR(v)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (v: string) => (
        <Tag color={v === "paid" ? "green" : "red"}>{v.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Method",
      dataIndex: "payment_method",
      key: "payment_method",
    },
  ];

  const groupedColumns = [
    {
      title: "Customer Name",
      dataIndex: "customer_name",
      key: "customer_name",
    },
    {
      title: "Total Invoice",
      dataIndex: "total_invoice",
      key: "total_invoice",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Total Receipts",
      dataIndex: "total_receipts",
      key: "total_receipts",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Total Pending",
      dataIndex: "total_pending",
      key: "total_pending",
      align: "right" as const,
      render: (v: number) => (
        <span
          className={v > 0 ? "text-red-500 font-semibold" : "text-green-600"}
        >
          {formatINR(v)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Receivable Report" description="Receivable Report" />
      <PageBreadcrumb pageTitle="Receivable Report" />

      <ButtonComponentCard
        title="Receivable Report"
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
                label: "Total Invoices",
                value: summary.total_invoices,
                isNum: true,
              },
              {
                label: "Total Invoice Amount",
                value: summary.total_invoice_amt,
              },
              { label: "Total Receipts", value: summary.total_receipts },
              {
                label: "Total Pending",
                value: summary.total_pending,
                red: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <p
                  className={`text-base font-semibold mt-1 ${item.red ? "text-red-500" : "text-gray-800 dark:text-white"}`}
                >
                  {item.isNum
                    ? item.value.toLocaleString("en-IN")
                    : formatINR(item.value as number)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* View toggle */}
        {fetched && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("grouped")}
              className={`px-3 py-1.5 text-xs rounded-md border ${viewMode === "grouped" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"}`}
            >
              Customer Wise
            </button>
            <button
              onClick={() => setViewMode("flat")}
              className={`px-3 py-1.5 text-xs rounded-md border ${viewMode === "flat" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"}`}
            >
              All Invoices
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
            scroll={{ x: 900 }}
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
            dataSource={customerWise}
            loading={loading}
            rowKey="customer_name"
            size="small"
            className="custom-orders-table"
            expandable={{
              expandedRowRender: (record: CustomerGroup) => (
                <Table
                  columns={flatColumns.filter((c) => c.key !== "sr_no")}
                  dataSource={record.invoices}
                  rowKey="invoice_no"
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
              customerWise.length > 0 && summary
                ? () => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <strong>Grand Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <strong>{formatINR(summary.total_invoice_amt)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <strong>{formatINR(summary.total_receipts)}</strong>
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

export default ReceivableReport;
