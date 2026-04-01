import { useEffect, useState } from "react";
import { Table } from "antd";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getStockLedgerSummaryService } from "./serviceappend";
import { handleError } from "../../utils/handleError";

interface StockLedgerRow {
  sr_no: number;
  product_name: string;
  product_code: string;
  total_purchased: number;
  sold_pos: number;
  sold_shop: number;
  total_outward: number;
  current_balance: number;
}

interface Summary {
  total_products: number;
  total_purchased: number;
  total_sold_pos: number;
  total_sold_shop: number;
  total_outward: number;
  total_balance: number;
}

const StockLedger = () => {
  const [rows, setRows] = useState<StockLedgerRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getStockLedgerSummaryService();
      setRows(res.rows || []);
      setSummary(res.summary || null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount — this is a live snapshot, no date filter needed
  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      title: "Sr No",
      dataIndex: "sr_no",
      key: "sr_no",
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      sorter: (a: StockLedgerRow, b: StockLedgerRow) =>
        a.product_name.localeCompare(b.product_name),
    },
    {
      title: "Product Code",
      dataIndex: "product_code",
      key: "product_code",
    },
    {
      title: "Total Purchased",
      dataIndex: "total_purchased",
      key: "total_purchased",
      align: "right" as const,
      sorter: (a: StockLedgerRow, b: StockLedgerRow) =>
        a.total_purchased - b.total_purchased,
      render: (v: number) => (
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {v.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      title: "Sold via POS",
      dataIndex: "sold_pos",
      key: "sold_pos",
      align: "right" as const,
      sorter: (a: StockLedgerRow, b: StockLedgerRow) => a.sold_pos - b.sold_pos,
      render: (v: number) => (
        <span
          className={v > 0 ? "text-orange-500 font-medium" : "text-gray-400"}
        >
          {v > 0 ? v.toLocaleString("en-IN") : "—"}
        </span>
      ),
    },
    {
      title: "Sold to Shop Owners",
      dataIndex: "sold_shop",
      key: "sold_shop",
      align: "right" as const,
      sorter: (a: StockLedgerRow, b: StockLedgerRow) =>
        a.sold_shop - b.sold_shop,
      render: (v: number) => (
        <span
          className={v > 0 ? "text-purple-600 font-medium" : "text-gray-400"}
        >
          {v > 0 ? v.toLocaleString("en-IN") : "—"}
        </span>
      ),
    },
    {
      title: "Total Outward",
      dataIndex: "total_outward",
      key: "total_outward",
      align: "right" as const,
      render: (v: number) => (
        <span className={v > 0 ? "text-red-500 font-medium" : "text-gray-400"}>
          {v > 0 ? v.toLocaleString("en-IN") : "—"}
        </span>
      ),
    },
    {
      title: "Current Balance",
      dataIndex: "current_balance",
      key: "current_balance",
      align: "right" as const,
      sorter: (a: StockLedgerRow, b: StockLedgerRow) =>
        a.current_balance - b.current_balance,
      render: (v: number) => (
        <span
          className={`font-bold text-base ${
            v <= 0
              ? "text-red-600"
              : v <= 10
                ? "text-orange-500"
                : "text-green-600"
          }`}
        >
          {v.toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="Stock Ledger"
        description="Product-wise stock summary — purchased, sold, and current balance"
      />
      <PageBreadcrumb pageTitle="Stock Ledger" />

      <ButtonComponentCard
        title="Stock Ledger Summary"
        buttonlink=""
        buttontitle=""
      >
        {/* Refresh + note */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Live snapshot — current balance matches the Manage Stock page.
            <span className="ml-2 inline-flex gap-3">
              <span className="text-orange-500 font-medium">■ POS Sales</span>
              <span className="text-purple-600 font-medium">
                ■ Shop Owner Sales
              </span>
              <span className="text-green-600 font-medium">
                ■ Current Balance
              </span>
            </span>
          </p>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
            {[
              {
                label: "Products",
                value: summary.total_products,
                isNum: true,
                color: "text-gray-800 dark:text-white",
                bg: "bg-gray-50 dark:bg-gray-800/50",
              },
              {
                label: "Total Purchased",
                value: summary.total_purchased,
                isNum: true,
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-900/20",
              },
              {
                label: "Sold via POS",
                value: summary.total_sold_pos,
                isNum: true,
                color: "text-orange-500",
                bg: "bg-orange-50 dark:bg-orange-900/20",
              },
              {
                label: "Sold to Shop Owners",
                value: summary.total_sold_shop,
                isNum: true,
                color: "text-purple-600",
                bg: "bg-purple-50 dark:bg-purple-900/20",
              },
              {
                label: "Total Outward",
                value: summary.total_outward,
                isNum: true,
                color: "text-red-500",
                bg: "bg-red-50 dark:bg-red-900/20",
              },
              {
                label: "Current Balance",
                value: summary.total_balance,
                isNum: true,
                color: "text-green-600",
                bg: "bg-green-50 dark:bg-green-900/20",
              },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-lg p-3`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                <p className={`text-base font-semibold mt-1 ${item.color}`}>
                  {Number(item.value).toLocaleString("en-IN")}
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
          locale={{ emptyText: "No stock data found." }}
          rowClassName={(record) =>
            record.current_balance <= 0
              ? "bg-red-50 dark:bg-red-900/10"
              : record.current_balance <= 10
                ? "bg-orange-50 dark:bg-orange-900/10"
                : ""
          }
          summary={
            rows.length > 0 && summary
              ? () => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <strong>Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong className="text-blue-600">
                        {summary.total_purchased.toLocaleString("en-IN")}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <strong className="text-orange-500">
                        {summary.total_sold_pos.toLocaleString("en-IN")}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <strong className="text-purple-600">
                        {summary.total_sold_shop.toLocaleString("en-IN")}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <strong className="text-red-500">
                        {summary.total_outward.toLocaleString("en-IN")}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      <strong className="text-green-600 text-base">
                        {summary.total_balance.toLocaleString("en-IN")}
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

export default StockLedger;
