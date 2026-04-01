import { useState } from "react";
import { Table } from "antd";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getAgeWiseShopReceivableReportService } from "../../services/reportservices";
import { handleError } from "../../utils/handleError";

interface AgeShopRow {
  sr_no: number;
  shop_owner_name: string;
  shop_owner_phone: string;
  order_no: string;
  order_date: string;
  days_old: number;
  order_status: string;
  total_amount: number;
  "0_30": number;
  "30_60": number;
  "60_90": number;
  "90_180": number;
  above_180: number;
}

interface ShopOwnerGroup {
  shop_owner_name: string;
  "0_30": number;
  "30_60": number;
  "60_90": number;
  "90_180": number;
  above_180: number;
  total: number;
  orders: AgeShopRow[];
}

interface Summary {
  total_pending_orders: number;
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

const ageBucketStyle = (v: number) =>
  v > 0 ? "text-red-500 font-medium" : "text-gray-400";

const AgeWiseShopReceivableReport = () => {
  const [_, setRows] = useState<AgeShopRow[]>([]);
  const [shopOwnerWise, setShopOwnerWise] = useState<ShopOwnerGroup[]>([]);
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
      const res = await getAgeWiseShopReceivableReportService({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setRows(res.rows || []);
      setShopOwnerWise(res.shop_owner_wise || []);
      setSummary(res.summary || null);
      setAsOfDate(res.as_of_date || "");
      setFetched(true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const groupedColumns = [
    {
      title: "Shop Owner",
      dataIndex: "shop_owner_name",
      key: "shop_owner_name",
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

  const orderColumns = [
    { title: "Order No", dataIndex: "order_no", key: "order_no" },
    {
      title: "Order Date",
      dataIndex: "order_date",
      key: "order_date",
    },
    {
      title: "Phone",
      dataIndex: "shop_owner_phone",
      key: "shop_owner_phone",
    },
    {
      title: "Days Old",
      dataIndex: "days_old",
      key: "days_old",
      align: "right" as const,
    },
    {
      title: "Order Status",
      dataIndex: "order_status",
      key: "order_status",
      render: (v: string) => v.replace(/_/g, " ").toUpperCase(),
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
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right" as const,
      render: (v: number) => <strong>{formatINR(v)}</strong>,
    },
  ];

  return (
    <>
      <PageMeta
        title="Age Wise Shop Receivable Report"
        description="Age Wise Shop Receivable Report"
      />
      <PageBreadcrumb pageTitle="Age Wise Shop Receivable Report" />

      <ButtonComponentCard
        title="Age Wise Shop Receivable Report"
        buttonlink=""
        buttontitle=""
      >
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Order From Date
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
              Order To Date
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
            Age calculated as of: <strong>{asOfDate}</strong> &nbsp;|&nbsp; Only
            showing orders pending delivery confirmation.
          </p>
        )}

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
                label: "Pending Orders",
                value: summary.total_pending_orders,
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
          dataSource={shopOwnerWise}
          loading={loading}
          rowKey="shop_owner_name"
          size="small"
          className="custom-orders-table"
          scroll={{ x: 900 }}
          expandable={{
            expandedRowRender: (record: ShopOwnerGroup) => (
              <Table
                columns={orderColumns}
                dataSource={record.orders}
                rowKey="order_no"
                size="small"
                pagination={false}
                scroll={{ x: 1100 }}
                className="custom-orders-table"
              />
            ),
          }}
          pagination={false}
          locale={{
            emptyText: fetched
              ? "No pending shop orders found."
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

export default AgeWiseShopReceivableReport;
