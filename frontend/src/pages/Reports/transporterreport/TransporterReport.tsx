import { useState, useEffect } from "react";
import { getUserTransporterReportService } from "./transporterreportservice";
import PageMeta from "../../../components/common/PageMeta";
import { downloadCSV, downloadPDF } from "../../../utils/downloadUtils";

interface TransporterEntry {
  id: string;
  type: "Stock Purchase" | "Franchise Delivery";
  date: string;
  reference: string;
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

export default function TransporterReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<TransporterEntry[]>([]);
  const [transporters, setTransporters] = useState<TransporterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTransporterId, setSelectedTransporterId] = useState<number | "">("");

  const fetchReport = async (params?: {
    start_date?: string;
    end_date?: string;
    transporter_id?: number;
  }) => {
    setLoading(true);
    try {
      const data = await getUserTransporterReportService(params);
      setSummary(data.summary);
      setEntries(data.entries);
      if (data.transporters) setTransporters(data.transporters);
    } catch (err) {
      console.error("Error fetching transporter report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = () => {
    const params: { start_date?: string; end_date?: string; transporter_id?: number } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedTransporterId !== "") params.transporter_id = selectedTransporterId;
    fetchReport(params);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSelectedTransporterId("");
    fetchReport();
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN");
  const fmtCost = (v: number) =>
    v > 0 ? `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";

  return (
    <div>
      <PageMeta
        title="Transporter Report | Xpilot"
        description="View your transporter usage and cost report"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
              Transporter Report
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All transporter usage — stock purchases & franchise deliveries
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            <button
              onClick={() =>
                downloadCSV(
                  entries,
                  [
                    { label: "Date", key: "date" },
                    { label: "Type", key: "type" },
                    { label: "Reference", key: "reference" },
                    { label: "Transporter", key: "transporter_name" },
                    { label: "Contact", key: "transporter_contact" },
                    { label: "Vehicle No.", key: "vehicle_number" },
                    { label: "Vehicle Type", key: "vehicle_type" },
                    { label: "From", key: "from_location" },
                    { label: "To", key: "to_location" },
                    { label: "Cost (₹)", key: "transporter_cost" },
                    { label: "Notes", key: "notes" },
                  ],
                  "transporter-report"
                )
              }
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              CSV
            </button>
            <button
              onClick={() =>
                downloadPDF(
                  entries,
                  [
                    { label: "Date", key: "date" },
                    { label: "Type", key: "type" },
                    { label: "Reference", key: "reference" },
                    { label: "Transporter", key: "transporter_name" },
                    { label: "Vehicle No.", key: "vehicle_number" },
                    { label: "From", key: "from_location" },
                    { label: "To", key: "to_location" },
                    { label: "Cost (₹)", key: "transporter_cost" },
                    { label: "Notes", key: "notes" },
                  ],
                  "transporter-report"
                )
              }
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              PDF
            </button>
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
            <label className="text-xs text-gray-500 dark:text-gray-400">Transporter</label>
            <select
              value={selectedTransporterId}
              onChange={(e) =>
                setSelectedTransporterId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">All transporters</option>
              {transporters.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.transporter_name}
                  {t.contact_number ? ` — ${t.contact_number}` : ""}
                </option>
              ))}
            </select>
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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.total_entries}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stock Purchase Cost</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{summary.total_stock_cost.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delivery Cost</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ₹{summary.total_delivery_cost.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Transport Cost</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ₹{summary.total_cost.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}

            {/* Table */}
            {entries.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No transporter entries found for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Ref / Order No.</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Transporter</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Vehicle</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Route</th>
                      <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Transport Cost</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {fmtDate(entry.date)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                              ${entry.type === "Stock Purchase"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {entry.reference}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {entry.transporter_name}
                          </div>
                          {entry.transporter_contact && (
                            <div className="text-xs text-gray-400">{entry.transporter_contact}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {entry.vehicle_number ? (
                            <div>
                              <div className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {entry.vehicle_number}
                              </div>
                              {entry.vehicle_type && (
                                <div className="text-xs text-gray-400">{entry.vehicle_type}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300">
                          {entry.from_location || entry.to_location ? (
                            <span>
                              {entry.from_location || "?"} → {entry.to_location || "?"}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                          {fmtCost(entry.transporter_cost)}
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">
                          {entry.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals footer */}
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-300 uppercase" colSpan={6}>
                        Total
                      </td>
                      <td className="py-3 px-3 text-right text-orange-600 dark:text-orange-400">
                        ₹{summary?.total_cost.toLocaleString("en-IN") ?? "0"}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
