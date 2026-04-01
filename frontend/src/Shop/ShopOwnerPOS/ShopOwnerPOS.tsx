import { useState, useEffect, useRef } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import PosComponentCard from "../../POS/PosComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { ShopPurchasedProduct } from "../../types/types";
import {
  usePOSCategories,
  usePOSProducts,
  useCustomers,
  useAddPOSOrder,
} from "../../hooks/shopOwnerPOS";
import ShopOwnerProductCard from "./ShopOwnerProductCard";
import NoPos from "../../POS/NoPos";
import Loader from "../../Loader/Loader";
import { Input, Select, Button, InputNumber } from "antd";
import { toast } from "react-toastify";
import PosAddcustomer from "../../POS/PosAddcustomer";

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

// Stable empty arrays — prevents useEffect([myProducts]) infinite loop
// when React Query data is still undefined ([] !== [] by reference)
const EMPTY_CATEGORIES: never[] = [];
const EMPTY_PRODUCTS: never[] = [];
const EMPTY_CUSTOMERS: never[] = [];

type CartItem = ShopPurchasedProduct & {
  cartQuantity: number;
  cartUnitPrice: number;
};

const ShopOwnerPOS = () => {
  const {
    data: myCategories = EMPTY_CATEGORIES,
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: catError,
  } = usePOSCategories();

  const {
    data: myProducts = EMPTY_PRODUCTS,
    isLoading: productsLoading,
    isError: productsError,
    error: prodError,
    refetch: refetchProducts,
  } = usePOSProducts();

  const {
    data: myCustomers = EMPTY_CUSTOMERS,
    isLoading: customersLoading,
    refetch: refetchCustomers,
  } = useCustomers();

  const orderMutation = useAddPOSOrder();

  const [productsByCategory, setProductsByCategory] = useState<ShopPurchasedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopPurchasedProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<
    "pending" | "confirmed" | "processing" | "ready" | "completed" | "cancelled"
  >("pending");
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "paid" | "partial" | "failed" | "refunded"
  >("pending");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "upi" | "bank_transfer" | "credit" | "mix"
  >("cash");
  const [notes, setNotes] = useState("");
  const [gridTitle, setGridTitle] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  // Financial fields
  const [cgstPercentage, setCgstPercentage] = useState(0);
  const [sgstPercentage, setSgstPercentage] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [transportCharge, setTransportCharge] = useState(0);
  const [labourCharge, setLabourCharge] = useState(0);

  // Partial payment
  const [amountPaid, setAmountPaid] = useState(0);

  // Mix payment
  const [onlineAmount, setOnlineAmount] = useState(0);
  const [offlineAmount, setOfflineAmount] = useState(0);

  const searchInputRef = useRef<any>(null);

  useEffect(() => {
    setFilteredProducts(myProducts as ShopPurchasedProduct[]);
  }, [myProducts]);

  // Auto-zero remaining when switching to paid
  useEffect(() => {
    if (paymentStatus === "paid") setAmountPaid(0);
  }, [paymentStatus]);

  const isLoading = categoriesLoading || productsLoading || customersLoading;
  const hasError = categoriesError || productsError;
  const errorMessage = catError?.message || prodError?.message || "Something went wrong";

  const handleCategoryProducts = (categoryName: string) => {
    if (!categoryName) {
      setProductsByCategory([]);
      setFilteredProducts(myProducts as ShopPurchasedProduct[]);
      setGridTitle("");
    } else {
      const filtered = (myProducts as ShopPurchasedProduct[]).filter(
        (p) => p.category_name === categoryName
      );
      setProductsByCategory(filtered);
      setFilteredProducts(filtered);
      setGridTitle(categoryName);
    }
  };

  const handleShowAllProducts = () => {
    setProductsByCategory([]);
    setFilteredProducts(myProducts as ShopPurchasedProduct[]);
    setGridTitle("");
  };

  const handleSearch = (value: string) => {
    const lv = value.toLowerCase();
    const source = productsByCategory.length > 0 ? productsByCategory : (myProducts as ShopPurchasedProduct[]);
    setFilteredProducts(source.filter((p) => p.product_name?.toLowerCase().includes(lv)));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const addToCart = (product: ShopPurchasedProduct) => {
    if (product.quantity <= 0) {
      toast.warn("Product out of stock");
      return;
    }
    const defaultPrice = product.selling_price ? parseFloat(product.selling_price) : 0;
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        if (exists.cartQuantity < product.quantity) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, cartQuantity: item.cartQuantity + 1 }
              : item
          );
        }
        toast.warn("Cannot add more, stock limit reached");
        return prev;
      }
      return [...prev, { ...product, cartQuantity: 1, cartUnitPrice: defaultPrice }];
    });
  };

  const updateCartQuantity = (id: number, delta: number, maxStock: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, cartQuantity: Math.min(maxStock, Math.max(1, item.cartQuantity + delta)) }
          : item
      )
    );
  };

  const updateCartPrice = (id: number, price: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cartUnitPrice: price } : item))
    );
  };

  const removeItem = (id: number) => setCart((prev) => prev.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);

  // Totals
  const subtotal = cart.reduce((acc, item) => acc + item.cartUnitPrice * item.cartQuantity, 0);
  const cgstAmount = (subtotal * cgstPercentage) / 100;
  const sgstAmount = (subtotal * sgstPercentage) / 100;
  const grossTotal = subtotal + cgstAmount + sgstAmount + transportCharge + labourCharge - discount;

  const handleSubmitOrder = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (paymentMethod === "mix") {
      const mixTotal = onlineAmount + offlineAmount;
      const expected = paymentStatus === "paid" ? grossTotal : amountPaid;
      if (Math.abs(mixTotal - expected) > 0.01) {
        toast.error(`Online + Offline (₹${mixTotal.toFixed(2)}) must equal amount paid (₹${expected.toFixed(2)})`);
        return;
      }
    }

    const payload: Record<string, any> = {
      customer: selectedCustomer,
      order_items: cart.map((item) => ({
        product: item.product,
        quantity: item.cartQuantity,
        unit_price: item.cartUnitPrice.toFixed(2),
      })),
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      cgst_percentage: cgstPercentage,
      sgst_percentage: sgstPercentage,
      discount_amount: discount.toFixed(2),
      labour_charges: labourCharge.toFixed(2),
      transport_charges: transportCharge.toFixed(2),
      notes: notes || "",
    };

    if (paymentStatus === "partial") {
      payload.amount_paid = amountPaid.toFixed(2);
    }
    if (paymentMethod === "mix") {
      payload.online_amount = onlineAmount.toFixed(2);
      payload.offline_amount = offlineAmount.toFixed(2);
    }

    orderMutation.mutate(payload as any, {
      onSuccess: () => {
        setCart([]);
        setSelectedCustomer(null);
        setOrderStatus("pending");
        setPaymentStatus("pending");
        setPaymentMethod("cash");
        setCgstPercentage(0);
        setSgstPercentage(0);
        setTransportCharge(0);
        setLabourCharge(0);
        setDiscount(0);
        setAmountPaid(0);
        setOnlineAmount(0);
        setOfflineAmount(0);
        setNotes("");
      },
    });
  };

  const date = new Date();
  const formatted = date.toLocaleString("en-US", {
    day: "numeric", month: "long", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  if (isLoading) {
    return (
      <>
        <PageMeta title="Shop POS" description="Franchise point of sale" />
        <Loader />
      </>
    );
  }

  if (hasError) {
    return (
      <>
        <PageMeta title="Shop POS" description="Franchise point of sale" />
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-400 dark:text-gray-600 mb-4">
            Error loading POS: {errorMessage}
          </p>
          <button
            onClick={() => { refetchProducts(); window.location.reload(); }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  if ((myProducts as ShopPurchasedProduct[]).length === 0) {
    return (
      <>
        <PageMeta title="Shop POS" description="Franchise point of sale" />
        <NoPos />
      </>
    );
  }

  return (
    <>
      <PageMeta title="Shop POS" description="Franchise point of sale" />

      {/* Date & Search */}
      <div className="mb-5">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-3">
            <div className="lg:col-span-4 md:col-span-6 col-span-1">
              <div className="theme-text text-sm">Date & Time: {formatted}</div>
            </div>
            <div className="lg:col-span-8 md:col-span-6 col-span-1">
              <Search
                ref={searchInputRef}
                placeholder="Search products (Ctrl + K)"
                className="custom-search"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Product grid */}
        <section className="col-span-1 md:col-span-8">
          <PosComponentCard title="Choose Category">
            <div className="flex flex-wrap items-center justify-start gap-6">
              <button
                onClick={handleShowAllProducts}
                className={`px-3 py-1 rounded theme-text-2 border-brand-500 border text-sm ${!gridTitle ? "bg-brand-200 !text-black font-semibold" : ""}`}
              >
                All
              </button>
              {(myCategories as any[]).slice(0, 12).map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryProducts(cat.category_name)}
                  className={`px-3 py-1 rounded theme-text-2 border-brand-500 border text-sm ${gridTitle === cat.category_name ? "bg-brand-200 !text-black font-semibold" : ""}`}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>

            <div className="my-4">
              <h2 className="font-bold mt-6 mb-4 theme-text-2">
                {gridTitle || "All Products"}
              </h2>
              <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
                {gridTitle && productsByCategory.length === 0 ? (
                  <div className="theme-text text-sm">No Products Found</div>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="relative cursor-pointer rounded-xl p-2 border dark:border-gray-600 w-auto h-auto break-all"
                    >
                      <ShopOwnerProductCard product={product} />
                    </div>
                  ))
                ) : (
                  <div className="theme-text text-sm">No Products Found</div>
                )}
              </div>
            </div>
          </PosComponentCard>
        </section>

        {/* Bills panel */}
        <section className="col-span-1 md:col-span-4">
          <ComponentCard title="Bills">
            {/* Customer */}
            <div className="mb-4 grid lg:grid-cols-12 md:grid-cols-6 gap-2">
              <Select
                placeholder="Select Customer"
                style={{ width: "100%" }}
                value={selectedCustomer ?? undefined}
                onChange={(val) => setSelectedCustomer(val)}
                className="lg:col-span-9 md:col-span-6"
                loading={customersLoading}
              >
                {(myCustomers as any[]).map((c: any) => (
                  <Option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </Option>
                ))}
              </Select>
              <Button
                type="primary"
                className="lg:col-span-3 md:col-span-6"
                onClick={() => setIsVisible(true)}
              >
                + Add
              </Button>
            </div>

            {cart.length === 0 ? (
              <p className="theme-text text-center text-sm mt-10">Cart is Empty</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold theme-text">Cart Items</h3>
                  <Button size="small" danger onClick={clearCart} type="link">Clear Cart</Button>
                </div>

                {/* Cart rows */}
                {cart.map((item) => (
                  <div key={item.id} className="border dark:border-gray-700 rounded-xl py-2 px-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium theme-text-2 text-sm truncate max-w-[130px]">
                        {item.product_name}
                      </p>
                      <Button
                        size="small"
                        className="!bg-red-500/[0.7] !text-white border dark:!border-gray-500"
                        danger
                        onClick={() => removeItem(item.id)}
                      >
                        ×
                      </Button>
                    </div>

                    {/* Inline unit price */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs theme-text">₹</span>
                      <InputNumber
                        min={0}
                        step={0.01}
                        precision={2}
                        value={item.cartUnitPrice}
                        onChange={(val) => updateCartPrice(item.id, val ?? 0)}
                        style={{ width: 90 }}
                        size="small"
                      />
                      <span className="text-xs theme-text">/ unit</span>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        className="!bg-white/[0.1] text-black dark:!text-white border dark:!border-gray-500"
                        onClick={() => updateCartQuantity(item.id, -1, item.quantity)}
                      >-</Button>
                      <InputNumber
                        min={1}
                        max={item.quantity}
                        value={item.cartQuantity}
                        style={{ width: 55 }}
                        size="small"
                        onChange={(val) => {
                          if (typeof val === "number")
                            updateCartQuantity(item.id, val - item.cartQuantity, item.quantity);
                        }}
                      />
                      <Button
                        size="small"
                        className="!bg-white/[0.1] text-black dark:!text-white border dark:!border-gray-500"
                        onClick={() => updateCartQuantity(item.id, 1, item.quantity)}
                      >+</Button>
                      <span className="text-xs theme-text ml-auto">
                        = ₹{(item.cartUnitPrice * item.cartQuantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="border-t dark:border-gray-500 pt-3 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="theme-text">Subtotal:</span>
                    <span className="theme-text-2">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {/* CGST */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm theme-text">CGST (%):</label>
                    <input
                      type="number" min="0" max="100" step="0.01"
                      value={cgstPercentage}
                      onChange={(e) => setCgstPercentage(Number(e.target.value))}
                      className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text bg-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  {cgstPercentage > 0 && (
                    <div className="flex justify-between text-xs theme-text">
                      <span>CGST Amount:</span>
                      <span>₹{cgstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* SGST */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm theme-text">SGST (%):</label>
                    <input
                      type="number" min="0" max="100" step="0.01"
                      value={sgstPercentage}
                      onChange={(e) => setSgstPercentage(Number(e.target.value))}
                      className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text bg-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  {sgstPercentage > 0 && (
                    <div className="flex justify-between text-xs theme-text">
                      <span>SGST Amount:</span>
                      <span>₹{sgstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Discount */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm theme-text">Discount (₹):</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text bg-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Transport */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm theme-text">Transport (₹):</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={transportCharge}
                      onChange={(e) => setTransportCharge(Number(e.target.value))}
                      className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text bg-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Labour */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm theme-text">Labour (₹):</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={labourCharge}
                      onChange={(e) => setLabourCharge(Number(e.target.value))}
                      className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text bg-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex justify-between font-bold pt-1 border-t dark:border-gray-600">
                    <span className="theme-text-2">Grand Total:</span>
                    <span className="theme-text-2">₹{grossTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Order & payment fields */}
                <div className="border-t dark:border-gray-500 pt-3 space-y-3">
                  {/* Order Status */}
                  <div>
                    <label className="block text-sm font-medium mb-1 theme-text">Order Status</label>
                    <Select style={{ width: "100%" }} value={orderStatus} onChange={setOrderStatus}>
                      <Option value="pending">Pending</Option>
                      <Option value="confirmed">Confirmed</Option>
                      <Option value="processing">Processing</Option>
                      <Option value="ready">Ready</Option>
                      <Option value="completed">Completed</Option>
                      <Option value="cancelled">Cancelled</Option>
                    </Select>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm font-medium mb-1 theme-text">Payment Status</label>
                    <Select style={{ width: "100%" }} value={paymentStatus} onChange={setPaymentStatus}>
                      <Option value="pending">Pending</Option>
                      <Option value="paid">Paid</Option>
                      <Option value="partial">Partial</Option>
                      <Option value="failed">Failed</Option>
                      <Option value="refunded">Refunded</Option>
                    </Select>
                  </div>

                  {/* Amount Paid — shown only for partial */}
                  {paymentStatus === "partial" && (
                    <div>
                      <label className="block text-sm font-medium mb-1 theme-text">
                        Amount Paid (₹)
                      </label>
                      <InputNumber
                        min={0}
                        max={grossTotal}
                        step={0.01}
                        precision={2}
                        value={amountPaid}
                        onChange={(val) => setAmountPaid(val ?? 0)}
                        style={{ width: "100%" }}
                        placeholder="0.00"
                      />
                      <div className="text-xs theme-text mt-1">
                        Remaining: ₹{Math.max(0, grossTotal - amountPaid).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium mb-1 theme-text">Payment Method</label>
                    <Select style={{ width: "100%" }} value={paymentMethod} onChange={setPaymentMethod}>
                      <Option value="cash">Cash</Option>
                      <Option value="card">Card</Option>
                      <Option value="upi">UPI</Option>
                      <Option value="bank_transfer">Bank Transfer</Option>
                      <Option value="credit">Credit</Option>
                      <Option value="mix">Mix (Online + Offline)</Option>
                    </Select>
                  </div>

                  {/* Mix payment breakdown */}
                  {paymentMethod === "mix" && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-2 border border-blue-200 dark:border-blue-700">
                      <p className="text-xs font-semibold theme-text">
                        Mix Payment — Total: ₹{(paymentStatus === "partial" ? amountPaid : grossTotal).toFixed(2)}
                      </p>
                      <div className="flex items-center justify-between">
                        <label className="text-sm theme-text">Online (₹):</label>
                        <InputNumber
                          min={0} step={0.01} precision={2}
                          value={onlineAmount}
                          onChange={(val) => setOnlineAmount(val ?? 0)}
                          style={{ width: 110 }}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm theme-text">Offline (₹):</label>
                        <InputNumber
                          min={0} step={0.01} precision={2}
                          value={offlineAmount}
                          onChange={(val) => setOfflineAmount(val ?? 0)}
                          style={{ width: 110 }}
                          placeholder="0.00"
                        />
                      </div>
                      {Math.abs(onlineAmount + offlineAmount - (paymentStatus === "partial" ? amountPaid : grossTotal)) > 0.01 && (
                        <p className="text-xs text-red-500">
                          Online + Offline must equal amount paid
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-1 theme-text">Notes</label>
                    <TextArea
                      rows={2}
                      placeholder="Add order notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="!bg-transparent theme-text dark:!border-gray-600"
                    />
                  </div>

                  <Button
                    type="primary"
                    block
                    onClick={handleSubmitOrder}
                    loading={orderMutation.isPending}
                    disabled={orderMutation.isPending}
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            )}
          </ComponentCard>
        </section>
      </section>

      {isVisible && (
        <PosAddcustomer
          visible={isVisible}
          onCancel={() => setIsVisible(false)}
          fetchCustomers={refetchCustomers}
        />
      )}
    </>
  );
};

export default ShopOwnerPOS;
