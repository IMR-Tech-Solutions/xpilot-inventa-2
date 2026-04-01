import { useState } from "react";
import { Table } from "antd";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getPurchaseRegisterService } from "../../services/reportservices";
import { handleError } from "../../utils/handleError";

interface PurchaseRow {
  sr_no: number;
  grn_date: string;
  invoice_date: string;
  invoice_no: string;
  vendor_name: string;
  basic_amount: number;
  tax_amount: number;
  round_off: number;
  total_amount: number;
}

interface Summary {
  total_invoices: number;
  total_basic: number;
  total_tax: number;
  total_amount: number;
}

const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(v);

const PurchaseRegister = () => {
  const [rows, setRows] = useState<PurchaseRow[]>([]);
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
      const res = await getPurchaseRegisterService({
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
    { title: "Sr No", dataIndex: "sr_no", key: "sr_no" },
    { title: "GRN Date", dataIndex: "grn_date", key: "grn_date" },
    {
      title: "Invoice Date",
      dataIndex: "invoice_date",
      key: "invoice_date",
    },
    { title: "Invoice No", dataIndex: "invoice_no", key: "invoice_no" },
    { title: "Vendor Name", dataIndex: "vendor_name", key: "vendor_name" },
    {
      title: "Basic Amount",
      dataIndex: "basic_amount",
      key: "basic_amount",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Tax Amount",
      dataIndex: "tax_amount",
      key: "tax_amount",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Round Off",
      dataIndex: "round_off",
      key: "round_off",
      align: "right" as const,
      render: (v: number) => v.toFixed(2),
    },
    {
      title: "Total Invoice Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right" as const,
      render: (v: number) => <strong>{formatINR(v)}</strong>,
    },
  ];

  return (
    <>
      <PageMeta
        title="Purchase Register"
        description="Purchase Register Report"
      />
      <PageBreadcrumb pageTitle="Purchase Register" />

      <ButtonComponentCard
        title="Purchase Register"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              {
                label: "Total Invoices",
                value: summary.total_invoices,
                isNum: true,
              },
              { label: "Total Basic Amount", value: summary.total_basic },
              { label: "Total Tax", value: summary.total_tax },
              { label: "Total Invoice Amount", value: summary.total_amount },
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
                    ? item.value.toLocaleString("en-IN")
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
          scroll={{ x: 900 }}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          locale={{
            emptyText: fetched
              ? "No records found."
              : "Click 'Generate Report' to load data.",
          }}
          summary={
            rows.length > 0
              ? () => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5}>
                      <strong>Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong>
                        {summary ? formatINR(summary.total_basic) : ""}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <strong>
                        {summary ? formatINR(summary.total_tax) : ""}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right" />
                    <Table.Summary.Cell index={4} align="right">
                      <strong>
                        {summary ? formatINR(summary.total_amount) : ""}
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

export default PurchaseRegister;
