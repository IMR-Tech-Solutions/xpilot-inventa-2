import { useState } from "react";
import { Table } from "antd";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getAgeWiseReceivableReportService } from "../../services/reportservices";
import { handleError } from "../../utils/handleError";

interface AgeRow {
  sr_no: number;
  customer_name: string;
  invoice_date: string;
  invoice_no: string;
  days_old: number;
  "0_30": number;
  "30_60": number;
  "60_90": number;
  "90_180": number;
  above_180: number;
  total: number;
}

interface CustomerGroup {
  customer_name: string;
  "0_30": number;
  "30_60": number;
  "60_90": number;
  "90_180": number;
  above_180: number;
  total: number;
  invoices: AgeRow[];
}

interface Summary {
  total_pending_invoices: number;
  total_0_30: number;
  total_30_60: number;
  total_60_90: number;
  total_90_180: number;
  total_above_180: number;
  grand_total: number;
}

const formatINR = (v: number) =>
  v > 0
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(v)
    : "-";

const AgeWiseReceivableReport = () => {
  const [_, setRows] = useState<AgeRow[]>([]);
  const [customerWise, setCustomerWise] = useState<CustomerGroup[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [asOfDate, setAsOfDate] = useState("");
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
      const res = await getAgeWiseReceivableReportService({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setRows(res.rows || []);
      setCustomerWise(res.customer_wise || []);
      setSummary(res.summary || null);
      setAsOfDate(res.as_of_date || "");
      setFetched(true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const ageBucketStyle = (v: number) =>
    v > 0 ? "text-red-500 font-medium" : "text-gray-400";

  const groupedColumns = [
    {
      title: "Customer Name",
      dataIndex: "customer_name",
      key: "customer_name",
    },
    {
      title: "0-30 Days",
      dataIndex: "0_30",
      key: "0_30",
      align: "right" as const,
      render: (v: number) => (
        <span className={ageBucketStyle(v)}>{formatINR(v)}</span>
      ),
    },
    {
      title: "30-60 Days",
      dataIndex: "30_60",
      key: "30_60",
      align: "right" as const,
      render: (v: number) => (
        <span className={ageBucketStyle(v)}>{formatINR(v)}</span>
      ),
    },
    {
      title: "60-90 Days",
      dataIndex: "60_90",
      key: "60_90",
      align: "right" as const,
      render: (v: number) => (
        <span className={ageBucketStyle(v)}>{formatINR(v)}</span>
      ),
    },
    {
      title: "90-180 Days",
      dataIndex: "90_180",
      key: "90_180",
      align: "right" as const,
      render: (v: number) => (
        <span className={ageBucketStyle(v)}>{formatINR(v)}</span>
      ),
    },
    {
      title: "Above 180",
      dataIndex: "above_180",
      key: "above_180",
      align: "right" as const,
      render: (v: number) => (
        <span className={ageBucketStyle(v)}>{formatINR(v)}</span>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right" as const,
      render: (v: number) => (
        <strong className="text-red-500">{formatINR(v)}</strong>
      ),
    },
  ];

  const invoiceColumns = [
    {
      title: "Invoice Date",
      dataIndex: "invoice_date",
      key: "invoice_date",
    },
    { title: "Invoice No", dataIndex: "invoice_no", key: "invoice_no" },
    {
      title: "Days Old",
      dataIndex: "days_old",
      key: "days_old",
      align: "right" as const,
    },
    {
      title: "0-30",
      dataIndex: "0_30",
      key: "0_30",
      align: "right" as const,
      render: (v: number) => (
        <span className={ageBucketStyle(v)}>{formatINR(v)}</span>
      ),
    },
    {
      title: "30-60",
      dataIndex: "30_60",
      key: "30_60",
      align: "right" as const,
      render: (v: number) => (
        <span className={ageBucketStyle(v)}>{formatINR(v)}</span>
      ),
    },
    {
      title: "60-90",
      dataIndex: "60_90",
      key: "60_90",
      align: "right" as const,
      render: (v: number) => (
        <span className={ageBucketStyle(v)}>{formatINR(v)}</span>
      ),
    },
    {
      title: "90-180",
      dataIndex: "90_180",
      key: "90_180",
      align: "right" as const,
      render: (v: number) => (
        <span className={ageBucketStyle(v)}>{formatINR(v)}</span>
      ),
    },
    {
      title: "Above 180",
      dataIndex: "above_180",
      key: "above_180",
      align: "right" as const,
      render: (v: number) => (
        <span className={ageBucketStyle(v)}>{formatINR(v)}</span>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right" as const,
      render: (v: number) => <strong>{formatINR(v)}</strong>,
    },
  ];

  return (
    <>
      <PageMeta
        title="Age Wise Receivable Report"
        description="Age Wise Receivable Report"
      />
      <PageBreadcrumb pageTitle="Age Wise Receivable Report" />

      <ButtonComponentCard
        title="Age Wise Receivable Report"
        buttonlink=""
        buttontitle=""
      >
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Invoice From Date
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
              Invoice To Date
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

        {asOfDate && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Age calculated as of: <strong>{asOfDate}</strong>
          </p>
        )}

        {/* Age bucket summary bar */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
            {[
              { label: "0-30 Days", value: summary.total_0_30 },
              { label: "30-60 Days", value: summary.total_30_60 },
              { label: "60-90 Days", value: summary.total_60_90 },
              { label: "90-180 Days", value: summary.total_90_180 },
              { label: "Above 180", value: summary.total_above_180 },
              {
                label: "Grand Total",
                value: summary.grand_total,
                highlight: true,
              },
              {
                label: "Pending Invoices",
                value: summary.total_pending_invoices,
                isNum: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg p-3 ${item.highlight ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" : "bg-gray-50 dark:bg-gray-800/50"}`}
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <p
                  className={`text-sm font-semibold mt-1 ${item.highlight ? "text-red-600" : "text-gray-800 dark:text-white"}`}
                >
                  {item.isNum
                    ? Number(item.value).toLocaleString("en-IN")
                    : new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        minimumFractionDigits: 0,
                      }).format(item.value as number)}
                </p>
              </div>
            ))}
          </div>
        )}

        <Table
          columns={groupedColumns}
          dataSource={customerWise}
          loading={loading}
          rowKey="customer_name"
          size="small"
          className="custom-orders-table"
          scroll={{ x: 900 }}
          expandable={{
            expandedRowRender: (record: CustomerGroup) => (
              <Table
                columns={invoiceColumns}
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
              ? "No pending receivables found."
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
                      <strong className="text-red-500">
                        {formatINR(summary.total_0_30)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <strong className="text-red-500">
                        {formatINR(summary.total_30_60)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <strong className="text-red-500">
                        {formatINR(summary.total_60_90)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <strong className="text-red-500">
                        {formatINR(summary.total_90_180)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      <strong className="text-red-500">
                        {formatINR(summary.total_above_180)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <strong className="text-red-600">
                        {formatINR(summary.grand_total)}
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )
              : undefined
          }
        />
      </ButtonComponentCard>
    </>
  );
};

export default AgeWiseReceivableReport;
