import { useState, useEffect } from "react";
import { Table, Tag, Statistic, Select, Button } from "antd";
import { FilePdfOutlined, FileTextOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getAdminTransporterReportService } from "./admintransporterreportservice";
import PageMeta from "../../../components/common/PageMeta";
import { downloadCSV, downloadPDF } from "../../../utils/downloadUtils";

interface TransporterEntry {
  id: string;
  type: "Stock Purchase" | "Franchise Delivery";
  date: string;
  reference: string;
  added_by: string;
  added_by_id: number | null;
  transporter_id: number;
  transporter_name: string;
  transporter_contact: string;
  vehicle_number: string;
  vehicle_type: string;
  from_location: string;
  to_location: string;
  transporter_cost: number;
  notes: string;
}

interface Summary {
  total_entries: number;
  total_stock_cost: number;
  total_delivery_cost: number;
  total_cost: number;
}

interface TransporterOption {
  id: number;
  transporter_name: string;
  contact_number: string | null;
}

interface UserOption {
  id: number;
  first_name: string;
  last_name: string;
  business_name: string | null;
}

export default function AdminTransporterReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<TransporterEntry[]>([]);
  const [transporters, setTransporters] = useState<TransporterOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [selectedTransporterId, setSelectedTransporterId] = useState<number | undefined>(undefined);

  const fetchReport = async (params?: {
    start_date?: string;
    end_date?: string;
    transporter_id?: number;
    user_id?: number;
  }) => {
    setLoading(true);
    try {
      const data = await getAdminTransporterReportService(params);
      setSummary(data.summary);
      setEntries(data.entries);
      if (data.transporters) setTransporters(data.transporters);
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error("Error fetching admin transporter report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = () => {
    const params: { start_date?: string; end_date?: string; transporter_id?: number; user_id?: number } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedTransporterId) params.transporter_id = selectedTransporterId;
    if (selectedUserId) params.user_id = selectedUserId;
    fetchReport(params);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSelectedUserId(undefined);
    setSelectedTransporterId(undefined);
    fetchReport();
  };

  const fmtCost = (v: number) =>
    v > 0 ? `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";

  const columns: ColumnsType<TransporterEntry> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (val) => (
        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {new Date(val).toLocaleDateString("en-IN")}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (val) => (
        <Tag color={val === "Stock Purchase" ? "blue" : "purple"} style={{ whiteSpace: "nowrap" }}>
          {val}
        </Tag>
      ),
    },
    {
      title: "Ref / Order No.",
      dataIndex: "reference",
      key: "reference",
      render: (val) => (
        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{val}</span>
      ),
    },
    {
      title: "Added By",
      dataIndex: "added_by",
      key: "added_by",
      render: (val) => <span className="text-sm text-gray-700 dark:text-gray-300">{val}</span>,
    },
    {
      title: "Transporter",
      key: "transporter",
      render: (_, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{row.transporter_name}</div>
          {row.transporter_contact && (
            <div className="text-xs text-gray-400">{row.transporter_contact}</div>
          )}
        </div>
      ),
    },
    {
      title: "Vehicle",
      key: "vehicle",
      render: (_, row) =>
        row.vehicle_number ? (
          <div>
            <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{row.vehicle_number}</div>
            {row.vehicle_type && <div className="text-xs text-gray-400">{row.vehicle_type}</div>}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Route",
      key: "route",
      render: (_, row) =>
        row.from_location || row.to_location ? (
          <span className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {row.from_location || "?"} → {row.to_location || "?"}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Transport Cost",
      dataIndex: "transporter_cost",
      key: "transporter_cost",
      align: "right",
      render: (val) => (
        <span className="font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
          {fmtCost(val)}
        </span>
      ),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (val) => <span className="text-xs text-gray-500 dark:text-gray-400">{val || "—"}</span>,
    },
  ];

  return (
    <div>
      <PageMeta
        title="Admin Transporter Report | Xpilot"
        description="System-wide transporter usage and cost report"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
              Admin Transporter Report
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              System-wide transporter usage — stock purchases & franchise deliveries
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            <Button
              icon={<FileTextOutlined />}
              onClick={() =>
                downloadCSV(
                  entries,
                  [
                    { label: "Date", key: "date" },
                    { label: "Type", key: "type" },
                    { label: "Reference", key: "reference" },
                    { label: "Added By", key: "added_by" },
                    { label: "Transporter", key: "transporter_name" },
                    { label: "Contact", key: "transporter_contact" },
                    { label: "Vehicle No.", key: "vehicle_number" },
                    { label: "Vehicle Type", key: "vehicle_type" },
                    { label: "From", key: "from_location" },
                    { label: "To", key: "to_location" },
                    { label: "Cost (₹)", key: "transporter_cost" },
                    { label: "Notes", key: "notes" },
                  ],
                  "admin-transporter-report"
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
                    { label: "Date", key: "date" },
                    { label: "Type", key: "type" },
                    { label: "Reference", key: "reference" },
                    { label: "Added By", key: "added_by" },
                    { label: "Transporter", key: "transporter_name" },
                    { label: "Vehicle No.", key: "vehicle_number" },
                    { label: "From", key: "from_location" },
                    { label: "To", key: "to_location" },
                    { label: "Cost (₹)", key: "transporter_cost" },
                    { label: "Notes", key: "notes" },
                  ],
                  "admin-transporter-report",
                  {
                    title: "Admin Transporter Report",
                    subtitle: "System-wide transporter usage — stock purchases & franchise deliveries",
                    dateRange: startDate && endDate
                      ? `${startDate} to ${endDate}`
                      : startDate ? `From ${startDate}` : endDate ? `To ${endDate}` : "All Dates",
                  }
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
            <label className="text-xs text-gray-500 dark:text-gray-400">Filter by Transporter</label>
            <Select
              allowClear
              placeholder="All transporters"
              style={{ width: 220 }}
              value={selectedTransporterId}
              onChange={(val) => setSelectedTransporterId(val)}
              options={transporters.map((t) => ({
                value: t.id,
                label: `${t.transporter_name}${t.contact_number ? ` — ${t.contact_number}` : ""}`,
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
                title={<span className="text-xs text-gray-500 dark:text-gray-400">Stock Purchase Cost</span>}
                value={summary.total_stock_cost}
                prefix="₹"
                precision={2}
                valueStyle={{ color: "#2563eb" }}
              />
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <Statistic
                title={<span className="text-xs text-gray-500 dark:text-gray-400">Delivery Cost</span>}
                value={summary.total_delivery_cost}
                prefix="₹"
                precision={2}
                valueStyle={{ color: "#7c3aed" }}
              />
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <Statistic
                title={<span className="text-xs text-gray-500 dark:text-gray-400">Total Transport Cost</span>}
                value={summary.total_cost}
                prefix="₹"
                precision={2}
                valueStyle={{ color: "#d97706" }}
              />
            </div>
          </div>
        )}

        {/* Table */}
        <Table
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No transporter entries found." }}
          summary={() => (
            <Table.Summary.Row className="font-semibold bg-gray-50 dark:bg-gray-800/50">
              <Table.Summary.Cell index={0} colSpan={7}>
                <span className="text-xs uppercase text-gray-500">Total</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  ₹{(summary?.total_cost ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} />
            </Table.Summary.Row>
          )}
        />
      </div>
    </div>
  );
}
