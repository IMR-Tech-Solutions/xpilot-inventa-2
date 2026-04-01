import { useState } from "react";
import { Table } from "antd";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getProductWisePurchaseRegisterService } from "../../services/reportservices";
import { handleError } from "../../utils/handleError";

interface PurchaseProductRow {
  sr_no: number;
  date: string;
  invoice_no: string;
  vendor_name: string;
  product_code: string;
  product_name: string;
  qty: number;
  unit: string;
  rate: number;
  basic_amount: number;
  tax_amount: number;
  round_off: number;
  total_amount: number;
  mfg_date: string;
  exp_date: string;
}

interface Summary {
  total_batches: number;
  total_qty: number;
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

const ProductWisePurchaseRegister = () => {
  const [rows, setRows] = useState<PurchaseProductRow[]>([]);
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
      const res = await getProductWisePurchaseRegisterService({
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
    { title: "Date", dataIndex: "date", key: "date" },
    {
      title: "Invoice No",
      dataIndex: "invoice_no",
      key: "invoice_no",
    },
    { title: "Vendor Name", dataIndex: "vendor_name", key: "vendor_name" },
    {
      title: "Product Code",
      dataIndex: "product_code",
      key: "product_code",
    },
    { title: "Product Name", dataIndex: "product_name", key: "product_name" },
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      align: "right" as const,
    },
    { title: "Unit", dataIndex: "unit", key: "unit" },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
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
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right" as const,
      render: (v: number) => <strong>{formatINR(v)}</strong>,
    },
    { title: "MFG Date", dataIndex: "mfg_date", key: "mfg_date"},
    { title: "EXP Date", dataIndex: "exp_date", key: "exp_date" },
  ];

  return (
    <>
      <PageMeta
        title="Product Wise Purchase Register"
        description="Product Wise Purchase Register Report"
      />
      <PageBreadcrumb pageTitle="Product Wise Purchase Register" />

      <ButtonComponentCard
        title="Product Wise Purchase Register"
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
                label: "Total Batches",
                value: summary.total_batches,
                isNum: true,
              },
              { label: "Total Qty", value: summary.total_qty, isNum: true },
              { label: "Total Basic", value: summary.total_basic },
              { label: "Total Tax", value: summary.total_tax },
              { label: "Total Amount", value: summary.total_amount },
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

export default ProductWisePurchaseRegister;
