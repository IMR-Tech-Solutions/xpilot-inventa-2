import { useState, useEffect } from "react";
import { Table, Drawer, Tag, Statistic, Select, Button } from "antd";
import { FilePdfOutlined, FileTextOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getAdminBrokerReportService } from "./adminbrokerreportservice";
import PageMeta from "../../../components/common/PageMeta";
import { downloadCSV, downloadPDF } from "../../../utils/downloadUtils";

interface BrokerEntry {
  id: number;
  added_by: string;
  added_by_id: number;
  product_name: string;
  product_sku: string;
  vendor: string;
  broker_name: string;
  broker_id: number;
  broker_phone: string | null;
  transporter: string | null;
  invoice_number: string | null;
  quantity: number;
  tonnes: number | null;
  purchase_price: number;
  broker_commission_rate: number;
  broker_commission: number;
  cgst_percentage: number;
  cgst: number;
  sgst_percentage: number;
  sgst: number;
  labour_cost: number;
  transporter_cost: number;
  manufacture_date: string;
  created_at: string;
}

interface Summary {
  total_entries: number;
  total_qty: number;
  total_commission: number;
  total_purchase_cost: number;
}

interface BrokerOption {
  id: number;
  broker_name: string;
  phone_number: string | null;
}

interface UserOption {
  id: number;
  first_name: string;
  last_name: string;
  business_name: string | null;
}

export default function AdminBrokerReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<BrokerEntry[]>([]);
  const [brokers, setBrokers] = useState<BrokerOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [selectedBrokerId, setSelectedBrokerId] = useState<number | undefined>(undefined);
  const [drawerEntry, setDrawerEntry] = useState<BrokerEntry | null>(null);

  const fetchReport = async (params?: {
    start_date?: string;
    end_date?: string;
    user_id?: number;
    broker_id?: number;
  }) => {
    setLoading(true);
    try {
      const data = await getAdminBrokerReportService(params);
      setSummary(data.summary);
      setEntries(data.entries);
      if (data.brokers) setBrokers(data.brokers);
      if (data.users) setUsers(data.users);
    } catch (error) {
      console.error("Error fetching admin broker report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = () => {
    const params: { start_date?: string; end_date?: string; user_id?: number; broker_id?: number } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedUserId) params.user_id = selectedUserId;
    if (selectedBrokerId) params.broker_id = selectedBrokerId;
    fetchReport(params);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSelectedUserId(undefined);
    setSelectedBrokerId(undefined);
    fetchReport();
  };

  const totalBags = entries.reduce((sum, e) => sum + e.quantity, 0);
  const totalTonnes = entries.reduce((sum, e) => sum + (e.tonnes ?? 0), 0);

  const columns: ColumnsType<BrokerEntry> = [
    {
      title: "Bill Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (val) => (
        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {new Date(val).toLocaleDateString("en-IN")}
        </span>
      ),
    },
    {
      title: "Party Name",
      key: "party",
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{row.vendor}</div>
          <div className="text-xs text-gray-400">{row.added_by}</div>
        </div>
      ),
    },
    {
      title: "Stock Item",
      key: "product",
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{row.product_name}</div>
          <div className="text-xs text-gray-400">{row.product_sku}</div>
        </div>
      ),
    },
    {
      title: "Broker",
      key: "broker",
      render: (_, row) => (
        <div>
          <Tag color="orange">{row.broker_name}</Tag>
          {row.broker_phone && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{row.broker_phone}</div>
          )}
        </div>
      ),
    },
    {
      title: "Bags",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
      render: (val) => <span className="font-semibold">{Number(val).toLocaleString("en-IN")}</span>,
    },
    {
      title: "Quantity",
      dataIndex: "tonnes",
      key: "tonnes",
      align: "right",
      render: (val) => (
        <span className="text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
          {val != null ? `${Number(val).toFixed(2)} ton` : "—"}
        </span>
      ),
    },
    {
      title: "Sauda Rate",
      dataIndex: "purchase_price",
      key: "purchase_price",
      align: "right",
      render: (val) => (
        <span className="whitespace-nowrap">₹{Number(val).toLocaleString("en-IN")}</span>
      ),
    },
    {
      title: "Commission Rate",
      dataIndex: "broker_commission_rate",
      key: "broker_commission_rate",
      align: "right",
      render: (val) => (
        <span className="whitespace-nowrap text-gray-700 dark:text-gray-300">
          {val > 0 ? `₹${Number(val).toLocaleString("en-IN")}/bag` : "—"}
        </span>
      ),
    },
    {
      title: "Commission Amount",
      dataIndex: "broker_commission",
      key: "broker_commission",
      align: "right",
      render: (val) => (
        <span className="font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
          ₹{Number(val).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      title: "",
      key: "action",
      render: (_, row) => (
        <button
          onClick={() => setDrawerEntry(row)}
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
        title="Admin Broker Report | Xpilot"
        description="System-wide broker commission report"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
              Admin Broker Report
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              System-wide broker commission entries across all users
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            <Button
              icon={<FileTextOutlined />}
              onClick={() =>
                downloadCSV(
                  entries,
                  [
                    { label: "Bill Date", key: "created_at" },
                    { label: "Party Name", key: "vendor" },
                    { label: "Stock Item", key: "product_name" },
                    { label: "Bags", key: "quantity" },
                    { label: "Quantity (ton)", key: "tonnes" },
                    { label: "Sauda Rate", key: "purchase_price" },
                    { label: "Commission Rate", key: "broker_commission_rate" },
                    { label: "Commission Amount", key: "broker_commission" },
                    { label: "Broker", key: "broker_name" },
                    { label: "Added By", key: "added_by" },
                    { label: "Invoice No.", key: "invoice_number" },
                  ],
                  "admin-broker-report"
                )
              }
            >
              CSV
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              onClick={() =>
                downloadPDF(
                  entries,
                  [
                    { label: "Bill Date", key: "created_at" },
                    { label: "Party Name", key: "vendor" },
                    { label: "Stock Item", key: "product_name" },
                    { label: "Bags", key: "quantity" },
                    { label: "Quantity (ton)", key: "tonnes" },
                    { label: "Sauda Rate", key: "purchase_price" },
                    { label: "Commission Rate", key: "broker_commission_rate" },
                    { label: "Commission Amount", key: "broker_commission" },
                    { label: "Broker", key: "broker_name" },
                    { label: "Added By", key: "added_by" },
                    { label: "Invoice No.", key: "invoice_number" },
                  ],
                  "admin-broker-report"
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
            <label className="text-xs text-gray-500 dark:text-gray-400">Filter by User</label>
            <Select
              allowClear
              placeholder="All users"
              style={{ width: 200 }}
              value={selectedUserId}
              onChange={(val) => setSelectedUserId(val)}
              options={users.map((u) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name}${u.business_name ? ` (${u.business_name})` : ""}`,
              }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Filter by Broker</label>
            <Select
              allowClear
              placeholder="All brokers"
              style={{ width: 200 }}
              value={selectedBrokerId}
              onChange={(val) => setSelectedBrokerId(val)}
              options={brokers.map((b) => ({
                value: b.id,
                label: `${b.broker_name}${b.phone_number ? ` — ${b.phone_number}` : ""}`,
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <Statistic
                title={<span className="text-xs text-gray-500 dark:text-gray-400">Total Entries</span>}
                value={summary.total_entries}
              />
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <Statistic
                title={<span className="text-xs text-gray-500 dark:text-gray-400">Total Bags</span>}
                value={totalBags}
                valueStyle={{ color: "#2563eb" }}
                suffix={totalTonnes > 0 ? <span className="text-xs text-gray-400 font-normal ml-1">({totalTonnes.toFixed(2)} ton)</span> : undefined}
              />
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <Statistic
                title={<span className="text-xs text-gray-500 dark:text-gray-400">Purchase Cost</span>}
                value={summary.total_purchase_cost}
                prefix="₹"
                precision={2}
              />
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <Statistic
                title={<span className="text-xs text-gray-500 dark:text-gray-400">Total Commission Paid</span>}
                value={summary.total_commission}
                prefix="₹"
                precision={2}
                valueStyle={{ color: "#d97706" }}
              />
            </div>
          </div>
        )}

        {/* Entries Table */}
        <Table
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No broker entries found." }}
          summary={() => (
            <Table.Summary.Row className="font-semibold bg-gray-50 dark:bg-gray-800/50">
              <Table.Summary.Cell index={0} colSpan={4}>
                <span className="text-xs uppercase text-gray-500">Total</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <span className="font-bold">{totalBags.toLocaleString("en-IN")}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {totalTonnes > 0 ? `${totalTonnes.toFixed(2)} ton` : "—"}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} colSpan={2} />
              <Table.Summary.Cell index={8} align="right">
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  ₹{(summary?.total_commission ?? 0).toLocaleString("en-IN")}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} />
            </Table.Summary.Row>
          )}
        />
      </div>

      {/* Entry Detail Drawer */}
      <Drawer
        title={drawerEntry ? `${drawerEntry.product_name} — ${drawerEntry.broker_name}` : "Entry Details"}
        open={!!drawerEntry}
        onClose={() => setDrawerEntry(null)}
        width={520}
      >
        {drawerEntry && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Product</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{drawerEntry.product_name}</p>
                <p className="text-xs text-gray-500">{drawerEntry.product_sku}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Added By</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{drawerEntry.added_by}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Vendor (Party)</p>
                <p className="text-gray-800 dark:text-gray-200">{drawerEntry.vendor}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Bags</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {drawerEntry.quantity.toLocaleString("en-IN")}
                  {drawerEntry.tonnes != null && (
                    <span className="ml-2 text-xs text-blue-500">= {drawerEntry.tonnes.toFixed(2)} ton</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Broker</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{drawerEntry.broker_name}</p>
                {drawerEntry.broker_phone && (
                  <p className="text-xs text-gray-500">{drawerEntry.broker_phone}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Transporter</p>
                <p className="text-gray-800 dark:text-gray-200">{drawerEntry.transporter || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Invoice No.</p>
                <p className="text-gray-800 dark:text-gray-200">{drawerEntry.invoice_number || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Bill Date</p>
                <p className="text-gray-800 dark:text-gray-200">
                  {new Date(drawerEntry.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Cost Breakdown</p>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Sauda Rate (Purchase Price)</span>
                <span>₹{drawerEntry.purchase_price.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">CGST ({drawerEntry.cgst_percentage}%)</span>
                <span>₹{drawerEntry.cgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">SGST ({drawerEntry.sgst_percentage}%)</span>
                <span>₹{drawerEntry.sgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Labour Cost</span>
                <span>₹{drawerEntry.labour_cost.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Transport Cost</span>
                <span>₹{drawerEntry.transporter_cost.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Commission Rate
                </span>
                <span>₹{drawerEntry.broker_commission_rate.toLocaleString("en-IN")}/bag</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 font-semibold text-orange-600 dark:text-orange-400">
                <span>Commission Amount ({drawerEntry.quantity} bags × ₹{drawerEntry.broker_commission_rate})</span>
                <span>₹{drawerEntry.broker_commission.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
