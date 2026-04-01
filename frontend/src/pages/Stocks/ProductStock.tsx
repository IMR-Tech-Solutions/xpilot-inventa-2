import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { getproductstockentriesservice } from "../../services/stockbatchservices";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { all_routes } from "../../Router/allroutes";
import { ProductStockEntriesResponse, StockEntryDetail } from "../../types/types";
import { useEffect, useState } from "react";
import { handleError } from "../../utils/handleError";
import { Tag } from "antd";
import dayjs from "dayjs";
import EditStockEntry from "./EditStockBatch";

const fmt = (v: string | null | undefined) =>
  v && parseFloat(v) > 0 ? `₹${parseFloat(v).toFixed(2)}` : null;

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <span className="theme-text text-sm">{label}:</span>
    <span className="ml-1 font-medium theme-text-2 text-sm">{value}</span>
  </div>
);

const ProductStock = () => {
  const { productID } = useParams();
  const [data, setData] = useState<ProductStockEntriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<StockEntryDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  let actualProductID: number | null = null;
  if (productID) {
    try {
      actualProductID = parseInt(atob(productID), 10);
    } catch {
      // invalid id
    }
  }

  const fetchData = async () => {
    if (!actualProductID) return;
    setLoading(true);
    try {
      const res = await getproductstockentriesservice(actualProductID);
      setData(res);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [actualProductID]);

  const renderEntry = (entry: StockEntryDetail, index: number) => (
    <div
      key={entry.id}
      className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-white/[0.03]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <span className="font-semibold theme-text-2">
              {entry.vendor_name}
            </span>
            {entry.invoice_number && (
              <Tag color="geekblue" className="text-xs">
                {entry.invoice_number}
              </Tag>
            )}
          </div>
          <div className="text-xs theme-text ml-8">
            Added {dayjs(entry.created_at).format("DD MMM YYYY, hh:mm A")}
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedEntry(entry);
            setModalVisible(true);
          }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          title="Edit"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 mb-3">
        <InfoRow label="Quantity" value={<Tag color="blue">{entry.quantity}</Tag>} />
        <InfoRow label="Purchase Price" value={`₹${parseFloat(entry.purchase_price).toFixed(2)}`} />
        <InfoRow label="MFG Date" value={entry.manufacture_date ? dayjs(entry.manufacture_date).format("DD-MM-YYYY") : "—"} />
      </div>

      {/* Optional cost fields — only show if present */}
      {(entry.cgst_percentage || entry.sgst_percentage || entry.cgst || entry.sgst || entry.varne_cost || entry.labour_cost ||
        entry.transporter_cost || entry.broker_commission_amount ||
        entry.broker_name || entry.transporter_name) && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
          {entry.cgst_percentage && parseFloat(entry.cgst_percentage) > 0 && (
            <InfoRow label="CGST" value={`${parseFloat(entry.cgst_percentage).toFixed(2)}% (₹${parseFloat(entry.cgst || "0").toFixed(2)})`} />
          )}
          {entry.sgst_percentage && parseFloat(entry.sgst_percentage) > 0 && (
            <InfoRow label="SGST" value={`${parseFloat(entry.sgst_percentage).toFixed(2)}% (₹${parseFloat(entry.sgst || "0").toFixed(2)})`} />
          )}
          {fmt(entry.varne_cost) && <InfoRow label="Varne Cost" value={fmt(entry.varne_cost)!} />}
          {fmt(entry.labour_cost) && <InfoRow label="Labour Cost" value={fmt(entry.labour_cost)!} />}
          {entry.transporter_name && (
            <InfoRow label="Transporter" value={<Tag color="orange">{entry.transporter_name}</Tag>} />
          )}
          {fmt(entry.transporter_cost) && (
            <InfoRow label="Transport Cost" value={fmt(entry.transporter_cost)!} />
          )}
          {entry.broker_name && (
            <InfoRow label="Broker" value={<Tag color="green">{entry.broker_name}</Tag>} />
          )}
          {fmt(entry.broker_commission_amount) && (
            <InfoRow label="Commission" value={fmt(entry.broker_commission_amount)!} />
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <PageMeta
        title="Product Stock"
        description="View stock entries for this product."
      />

      <ButtonComponentCard
        title={data?.product_name || "Product Stock"}
        buttonlink={all_routes.addstock}
        buttontitle="Add Stock"
      >
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600">
              {data?.current_stock ?? 0}
            </div>
            <div className="text-sm theme-text mt-0.5">Current Stock</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600">
              {data?.stock_entries?.length ?? 0}
            </div>
            <div className="text-sm theme-text mt-0.5">Total Entries</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold theme-text-2">
              {data?.stock_entries?.reduce((sum, e) => sum + e.quantity, 0) ?? 0}
            </div>
            <div className="text-sm theme-text mt-0.5">Total Purchased</div>
          </div>
        </div>
      </ButtonComponentCard>

      {/* Stock entries list */}
      <div className="mt-6">
        {loading && (
          <div className="text-center py-10 theme-text">Loading...</div>
        )}

        {!loading && data?.stock_entries && data.stock_entries.length > 0 && (
          <div className="space-y-3">
            {data.stock_entries.map((entry, i) => renderEntry(entry, i))}
          </div>
        )}

        {!loading && (!data?.stock_entries || data.stock_entries.length === 0) && (
          <div className="text-center py-12 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-xl">
            <h3 className="text-lg font-medium theme-text-2">No stock entries yet.</h3>
            <p className="text-sm theme-text mt-1">
              Add stock for this product to see entries here.
            </p>
          </div>
        )}
      </div>

      {selectedEntry && (
        <EditStockEntry
          entry={selectedEntry}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
};

export default ProductStock;
