import { useState, useEffect } from "react";
import { getUserBrokerReportService } from "./brokerreportservice";
import PageMeta from "../../../components/common/PageMeta";

interface BrokerEntry {
  id: number;
  product_name: string;
  product_sku: string;
  vendor: string;
  broker_name: string;
  broker_id: number;
  broker_phone: string | null;
  transporter: string | null;
  quantity: number;
  purchase_price: number;
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

export default function BrokerReport() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<BrokerEntry[]>([]);
  const [brokers, setBrokers] = useState<BrokerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedBrokerId, setSelectedBrokerId] = useState<number | "">("");
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

  const fetchReport = async (params?: {
    start_date?: string;
    end_date?: string;
    broker_id?: number;
  }) => {
    setLoading(true);
    try {
      const data = await getUserBrokerReportService(params);
      setSummary(data.summary);
      setEntries(data.entries);
      if (data.brokers) setBrokers(data.brokers);
    } catch (error) {
      console.error("Error fetching broker report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilter = () => {
    const params: { start_date?: string; end_date?: string; broker_id?: number } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedBrokerId !== "") params.broker_id = selectedBrokerId;
    fetchReport(params);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSelectedBrokerId("");
    fetchReport();
  };

  return (
    <div>
      <PageMeta
        title="Broker Report | Xpilot"
        description="View your broker commission report"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl mb-1">
            Broker Report
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Stock entries where a broker was involved — commission breakdown
          </p>
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
            <label className="text-xs text-gray-500 dark:text-gray-400">Broker</label>
            <select
              value={selectedBrokerId}
              onChange={(e) => setSelectedBrokerId(e.target.value === "" ? "" : Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">All brokers</option>
              {brokers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.broker_name}{b.phone_number ? ` — ${b.phone_number}` : ""}
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_entries}</p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Qty</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.total_qty}</p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Purchase Cost</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{summary.total_purchase_cost.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Commission Paid</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ₹{summary.total_commission.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}

            {/* Entries Table */}
            {entries.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No broker entries found for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Broker</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transporter</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purchase Price</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commission</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="py-3 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {entries.map((entry) => (
                      <>
                        <tr
                          key={entry.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{entry.product_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{entry.product_sku}</div>
                          </td>
                          <td className="py-3 px-3 text-gray-800 dark:text-gray-200">{entry.vendor}</td>
                          <td className="py-3 px-3">
                            <div className="text-gray-900 dark:text-gray-100">{entry.broker_name}</div>
                            {entry.broker_phone && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{entry.broker_phone}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{entry.transporter || "—"}</td>
                          <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-gray-100">{entry.quantity}</td>
                          <td className="py-3 px-3 text-right text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            ₹{entry.purchase_price.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                            ₹{entry.broker_commission.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(entry.created_at).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                            >
                              {expandedEntry === entry.id ? "Hide" : "Costs"}
                            </button>
                          </td>
                        </tr>
                        {expandedEntry === entry.id && (
                          <tr key={`${entry.id}-costs`} className="bg-gray-50 dark:bg-gray-800/30">
                            <td colSpan={9} className="px-6 py-3">
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">CGST ({entry.cgst_percentage}%)</span>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">₹{entry.cgst.toLocaleString("en-IN")}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">SGST ({entry.sgst_percentage}%)</span>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">₹{entry.sgst.toLocaleString("en-IN")}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Labour Cost</span>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">₹{entry.labour_cost.toLocaleString("en-IN")}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Transport Cost</span>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">₹{entry.transporter_cost.toLocaleString("en-IN")}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Mfg Date</span>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">
                                    {new Date(entry.manufacture_date).toLocaleDateString("en-IN")}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
