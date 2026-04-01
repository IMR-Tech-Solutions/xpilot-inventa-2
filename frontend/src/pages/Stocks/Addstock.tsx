import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Spinner from "../../components/spinner/spinner";
import { handleError } from "../../utils/handleError";
import { getmyactivevendorservice } from "../../services/vendorservices";
import { getmyactiveproductservice } from "../../services/productservices";
import { getmyactivebrokerservice } from "../../services/brokerservices";
import { getMyActiveTransporterService } from "../../services/transporterservices";
import { bulkaddstockentryservice } from "../../services/stockbatchservices";
import { all_routes } from "../../Router/allroutes";
import { useNavigate } from "react-router";
import {
  VendorData,
  ProductData,
  BrokerDataType,
  TransporterData,
} from "../../types/types";
import dayjs from "dayjs";

type Step = 1 | 2 | 3;

interface ItemForm {
  product: number | null;
  quantity: string;
  purchase_price: string;
  cgst_percentage: string;
  sgst_percentage: string;
  manufacture_date: string;
}

interface SharedForm {
  vendor: number | null;
  transporter: number | null;
  transporter_cost: string;
  varne_cost: string;
  labour_cost: string;
  broker: number | null;
  broker_commission_amount: string;
}

const emptyItem: ItemForm = {
  product: null,
  quantity: "",
  purchase_price: "",
  cgst_percentage: "",
  sgst_percentage: "",
  manufacture_date: dayjs().format("YYYY-MM-DD"),
};

const emptyShared: SharedForm = {
  vendor: null,
  transporter: null,
  transporter_cost: "",
  varne_cost: "",
  labour_cost: "",
  broker: null,
  broker_commission_amount: "",
};

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ current }: { current: Step }) => {
  const steps = [
    { n: 1, label: "Vendor & Costs" },
    { n: 2, label: "Add Products" },
    { n: 3, label: "Review & Submit" },
  ];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${current === s.n
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900"
                  : current > s.n
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
            >
              {current > s.n ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : s.n}
            </div>
            <span className={`mt-1.5 text-xs font-medium whitespace-nowrap
              ${current === s.n ? "text-blue-600 dark:text-blue-400" : current > s.n ? "text-green-500" : "text-gray-400 dark:text-gray-500"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-14 md:w-20 h-0.5 mx-2 mb-5 transition-all
              ${current > s.n ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const Addstock = () => {
  const navigate = useNavigate();
  const reviewRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [shared, setShared] = useState<SharedForm>({ ...emptyShared });
  const [currentItem, setCurrentItem] = useState<ItemForm>({ ...emptyItem });
  const [items, setItems] = useState<ItemForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [brokers, setBrokers] = useState<BrokerDataType[]>([]);
  const [transporters, setTransporters] = useState<TransporterData[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [vRes, pRes, bRes, tRes] = await Promise.all([
          getmyactivevendorservice(),
          getmyactiveproductservice(),
          getmyactivebrokerservice(),
          getMyActiveTransporterService(),
        ]);
        setVendors(vRes);
        setProducts(pRes);
        setBrokers(bRes);
        setTransporters(tRes);
      } catch (err) {
        handleError(err);
      } finally {
        setIsFetching(false);
      }
    })();
  }, []);

  const setS = (field: keyof SharedForm, value: string | number | null) =>
    setShared((prev) => ({ ...prev, [field]: value }));

  const setI = (field: keyof ItemForm, value: string | number | null) =>
    setCurrentItem((prev) => ({ ...prev, [field]: value }));

  // ── Lookups ──────────────────────────────────────────────────────────────
  const getProductName = (id: number | null) =>
    products.find((p) => p.id === id)?.product_name ?? "Unknown";
  const selectedVendor = vendors.find((v) => v.id === shared.vendor);
  const selectedTransporter = transporters.find((t) => t.id === shared.transporter);
  const selectedBroker = brokers.find((b) => b.id === shared.broker);

  // ── Validation ───────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!shared.vendor) { toast.error("Please select a vendor."); return false; }
    if (shared.transporter && !shared.transporter_cost) {
      toast.error("Enter transporter cost."); return false;
    }
    for (const f of ["transporter_cost", "varne_cost", "labour_cost"] as (keyof SharedForm)[]) {
      const v = shared[f] as string;
      if (v && parseFloat(v) < 0) { toast.error(`${f.replace(/_/g, " ")} cannot be negative.`); return false; }
    }
    return true;
  };

  const validateStep2 = () => {
    if (items.length === 0) { toast.error("Add at least one product entry."); return false; }
    return true;
  };

  const addItemToList = () => {
    if (!currentItem.product) { toast.error("Please select a product."); return; }
    if (!currentItem.quantity || parseFloat(currentItem.quantity) <= 0) {
      toast.error("Quantity must be greater than 0."); return;
    }
    if (!currentItem.purchase_price || parseFloat(currentItem.purchase_price) <= 0) {
      toast.error("Please enter a valid purchase price."); return;
    }
    if (!currentItem.manufacture_date) { toast.error("Please select a manufacture date."); return; }

    // Prevent duplicate product in the list
    if (items.some((it) => it.product === currentItem.product)) {
      toast.error(`${getProductName(currentItem.product)} is already added. Remove it first to change.`);
      return;
    }

    setItems((prev) => [...prev, { ...currentItem }]);
    setCurrentItem({ ...emptyItem });
    toast.success("Product added to list.");

    setTimeout(() => {
      reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => setStep((s) => (s - 1) as Step);

  const handleSubmit = async () => {
    if (!shared.vendor || items.length === 0) return;

    if (shared.broker && (!shared.broker_commission_amount || parseFloat(shared.broker_commission_amount) < 0)) {
      toast.error("Please enter a valid broker commission amount."); return;
    }

    const payload: Record<string, any> = {
      vendor: shared.vendor,
      items: items.map((it) => ({
        product: it.product,
        quantity: parseInt(it.quantity),
        purchase_price: it.purchase_price,
        ...(it.cgst_percentage ? { cgst_percentage: it.cgst_percentage } : {}),
        ...(it.sgst_percentage ? { sgst_percentage: it.sgst_percentage } : {}),
        manufacture_date: it.manufacture_date,
      })),
    };

    if (shared.transporter) {
      payload.transporter = shared.transporter;
      payload.transporter_cost = shared.transporter_cost || "0";
    }
    if (shared.varne_cost) payload.varne_cost = shared.varne_cost;
    if (shared.labour_cost) payload.labour_cost = shared.labour_cost;
    if (shared.broker) {
      payload.broker = shared.broker;
      payload.broker_commission_amount = shared.broker_commission_amount || "0";
    }

    try {
      setIsLoading(true);
      const res = await bulkaddstockentryservice(payload);
      toast.success(`${res.entries_created} entr${res.entries_created === 1 ? "y" : "ies"} added! Invoice: ${res.invoice_number}`);
      setShared({ ...emptyShared });
      setItems([]);
      setCurrentItem({ ...emptyItem });
      setStep(1);
      navigate(all_routes.managestock);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fmt = (v: string) => (v && parseFloat(v) > 0 ? `₹${parseFloat(v).toFixed(2)}` : "—");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <PageMeta title="Add Stock" description="Add new stock entries" />
      <PageBreadcrumb pageTitle="Add Stock" />

      <div className="max-w-3xl mx-auto">
        <StepIndicator current={step} />

        {/* ─── STEP 1: Vendor & Costs ─────────────────────────────────────── */}
        {step === 1 && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold theme-text-2">Vendor & Cost Details</h2>
                <p className="text-sm theme-text mt-0.5">These apply to all products in this purchase.</p>
              </div>
              <a href={all_routes.managestock} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                View All Stocks
              </a>
            </div>

            {/* Vendor */}
            <div className="mb-6">
              <Label>Vendor <span className="text-red-500">*</span></Label>
              <select
                value={shared.vendor ?? ""}
                onChange={(e) => setS("vendor", Number(e.target.value) || null)}
                className="input-field"
                disabled={isFetching}
              >
                <option value="">{isFetching ? "Loading..." : "Select Vendor"}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id} className="text-black">{v.vendor_name}</option>
                ))}
              </select>
            </div>

            {/* Shared costs */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold theme-text uppercase tracking-wider mb-3">Additional Costs (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Varne Cost (₹)</Label>
                  <input type="number" step="0.01" min="0" value={shared.varne_cost}
                    onChange={(e) => setS("varne_cost", e.target.value)} className="input-field" placeholder="0.00" />
                </div>
                <div>
                  <Label>Labour Cost (₹)</Label>
                  <input type="number" step="0.01" min="0" value={shared.labour_cost}
                    onChange={(e) => setS("labour_cost", e.target.value)} className="input-field" placeholder="0.00" />
                </div>
              </div>
            </div>

            {/* Transporter */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold theme-text uppercase tracking-wider mb-3">Transporter (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Transporter</Label>
                  <select
                    value={shared.transporter ?? ""}
                    onChange={(e) => {
                      const val = Number(e.target.value) || null;
                      setShared((prev) => ({ ...prev, transporter: val, transporter_cost: val ? prev.transporter_cost : "" }));
                    }}
                    className="input-field"
                  >
                    <option value="">No Transporter</option>
                    {transporters.map((t) => (
                      <option key={t.id} value={t.id} className="text-black">{t.transporter_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Transport Cost (₹){shared.transporter && <span className="text-red-500"> *</span>}</Label>
                  <input type="number" step="0.01" min="0" value={shared.transporter_cost}
                    onChange={(e) => setS("transporter_cost", e.target.value)}
                    className="input-field" placeholder="0.00" disabled={!shared.transporter} />
                </div>
              </div>
            </div>

            {/* Broker */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold theme-text uppercase tracking-wider mb-3">Broker (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Broker</Label>
                  <select
                    value={shared.broker ?? ""}
                    onChange={(e) => {
                      const val = Number(e.target.value) || null;
                      const broker = brokers.find((b) => b.id === val);
                      setShared((prev) => ({
                        ...prev,
                        broker: val,
                        broker_commission_amount: broker?.default_commission_amount
                          ? String(broker.default_commission_amount) : "",
                      }));
                    }}
                    className="input-field"
                  >
                    <option value="">No Broker</option>
                    {brokers.map((b) => (
                      <option key={b.id} value={b.id} className="text-black">{b.broker_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Commission (₹){shared.broker && <span className="text-red-500"> *</span>}</Label>
                  <input type="number" step="0.01" min="0" value={shared.broker_commission_amount}
                    onChange={(e) => setS("broker_commission_amount", e.target.value)}
                    className="input-field" placeholder="0.00" disabled={!shared.broker} />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button type="button" onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                Next: Add Products
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </Card>
        )}

        {/* ─── STEP 2: Add Products ───────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold theme-text-2">Add Products</h2>
                  <p className="text-sm theme-text mt-0.5">Add one or more products. Each can have its own qty, price and tax.</p>
                </div>
                {selectedVendor && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
                    {selectedVendor.vendor_name}
                  </span>
                )}
              </div>

              {/* Product entry form */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Product <span className="text-red-500">*</span></Label>
                    <select value={currentItem.product ?? ""} onChange={(e) => setI("product", Number(e.target.value) || null)}
                      className="input-field" disabled={isFetching}>
                      <option value="">{isFetching ? "Loading..." : "Select Product"}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} className="text-black"
                          disabled={items.some((it) => it.product === p.id)}>
                          {p.product_name}{p.unit_name ? ` (${p.unit_name})` : ""} — Stock: {p.current_stock}
                          {items.some((it) => it.product === p.id) ? " ✓ Added" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Quantity <span className="text-red-500">*</span></Label>
                    <input type="number" min="1" value={currentItem.quantity}
                      onChange={(e) => setI("quantity", e.target.value)}
                      className="input-field" placeholder="Enter quantity" />
                  </div>
                  <div>
                    <Label>Purchase Price (₹) <span className="text-red-500">*</span></Label>
                    <input type="number" step="0.01" min="0" value={currentItem.purchase_price}
                      onChange={(e) => setI("purchase_price", e.target.value)}
                      className="input-field" placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Manufacture Date <span className="text-red-500">*</span></Label>
                    <input type="date" value={currentItem.manufacture_date}
                      onChange={(e) => setI("manufacture_date", e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <Label>CGST (%)</Label>
                    <input type="number" step="0.01" min="0" max="100" value={currentItem.cgst_percentage}
                      onChange={(e) => setI("cgst_percentage", e.target.value)} className="input-field" placeholder="0.00" />
                  </div>
                  <div>
                    <Label>SGST (%)</Label>
                    <input type="number" step="0.01" min="0" max="100" value={currentItem.sgst_percentage}
                      onChange={(e) => setI("sgst_percentage", e.target.value)} className="input-field" placeholder="0.00" />
                  </div>
                </div>
                <button type="button" onClick={addItemToList}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add to List
                </button>
              </div>

              {/* Added items list */}
              {items.length > 0 && (
                <div ref={reviewRef}>
                  <h3 className="text-sm font-semibold theme-text-2 mb-3">
                    Added Products ({items.length})
                  </h3>
                  <div className="space-y-2">
                    {items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium theme-text-2 text-sm truncate">{getProductName(it.product)}</div>
                            <div className="text-xs theme-text mt-0.5 flex flex-wrap gap-x-3">
                              <span>Qty: {it.quantity}</span>
                              <span>Price: ₹{it.purchase_price}</span>
                              {it.cgst_percentage && parseFloat(it.cgst_percentage) > 0 && <span>CGST: {it.cgst_percentage}%</span>}
                              {it.sgst_percentage && parseFloat(it.sgst_percentage) > 0 && <span>SGST: {it.sgst_percentage}%</span>}
                              <span>MFG: {dayjs(it.manufacture_date).format("DD MMM YYYY")}</span>
                            </div>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeItem(i)}
                          className="ml-3 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6" />
                            <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {items.length === 0 && (
                <p className="text-sm theme-text text-center py-4">No products added yet.</p>
              )}

              <div className="flex justify-between mt-6">
                <button type="button" onClick={handleBack}
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>
                <button type="button" onClick={handleNext} disabled={items.length === 0}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-white
                    ${items.length === 0 ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                  Review ({items.length} product{items.length !== 1 ? "s" : ""})
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ─── STEP 3: Review & Submit ────────────────────────────────────── */}
        {step === 3 && (
          <Card>
            <div className="mb-6">
              <h2 className="text-lg font-semibold theme-text-2">Review & Submit</h2>
              <p className="text-sm theme-text mt-0.5">Confirm everything looks correct, then submit.</p>
            </div>

            {/* Shared info */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-5">
              <h3 className="text-xs font-semibold theme-text uppercase tracking-wider mb-3">Purchase Info</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <div><div className="text-xs theme-text">Vendor</div><div className="font-medium theme-text-2">{selectedVendor?.vendor_name ?? "—"}</div></div>
                {selectedTransporter && (
                  <div><div className="text-xs theme-text">Transporter</div><div className="font-medium theme-text-2">{selectedTransporter.transporter_name}</div></div>
                )}
                {shared.transporter_cost && parseFloat(shared.transporter_cost) > 0 && (
                  <div><div className="text-xs theme-text">Transport Cost</div><div className="font-medium theme-text-2">{fmt(shared.transporter_cost)}</div></div>
                )}
                {shared.varne_cost && parseFloat(shared.varne_cost) > 0 && (
                  <div><div className="text-xs theme-text">Varne Cost</div><div className="font-medium theme-text-2">{fmt(shared.varne_cost)}</div></div>
                )}
                {shared.labour_cost && parseFloat(shared.labour_cost) > 0 && (
                  <div><div className="text-xs theme-text">Labour Cost</div><div className="font-medium theme-text-2">{fmt(shared.labour_cost)}</div></div>
                )}
                {selectedBroker && (
                  <div><div className="text-xs theme-text">Broker</div><div className="font-medium theme-text-2">{selectedBroker.broker_name}</div></div>
                )}
                {shared.broker_commission_amount && parseFloat(shared.broker_commission_amount) > 0 && (
                  <div><div className="text-xs theme-text">Commission</div><div className="font-medium theme-text-2">{fmt(shared.broker_commission_amount)}</div></div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold theme-text uppercase tracking-wider mb-3">Products ({items.length})</h3>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium theme-text-2 text-sm">{getProductName(it.product)}</div>
                      <div className="text-xs theme-text mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Qty: <strong>{it.quantity}</strong></span>
                        <span>Price: <strong>₹{it.purchase_price}</strong></span>
                        <span>MFG: <strong>{dayjs(it.manufacture_date).format("DD MMM YYYY")}</strong></span>
                        {it.cgst && parseFloat(it.cgst) > 0 && <span>CGST: <strong>₹{it.cgst}</strong></span>}
                        {it.sgst && parseFloat(it.sgst) > 0 && <span>SGST: <strong>₹{it.sgst}</strong></span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={handleBack}
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
              <button type="button" onClick={handleSubmit} disabled={isLoading}
                className={`flex items-center gap-2 px-8 py-2.5 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600 shadow-theme-xs transition ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}>
                {isLoading && <Spinner />}
                {isLoading ? "Submitting..." : `Submit ${items.length} Product${items.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default Addstock;
