import { useState, useEffect, useRef } from "react";
import ComponentCard from "../components/common/ComponentCard";
import PosComponentCard from "./PosComponentCard";
import PageMeta from "../components/common/PageMeta";
import { ProductData, POSOrderPayload } from "../types/types";
import {
  usePOSProductCategories,
  useManagerStockedProducts,
  useCustomers,
  useAddManagerPOSOrder,
} from "../hooks/normalPOS";
import ProductCard from "./ProductCard";
import NoPos from "./NoPos";
import Loader from "../Loader/Loader";
import { Input, Select, Button, message, InputNumber } from "antd";
import { toast } from "react-toastify";
import PosAddcustomer from "./PosAddcustomer";

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface CartItem extends ProductData {
  cartQuantity: number;
  cartUnitPrice: number;
}

const Pos = () => {
  const {
    data: myCategories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: catError,
  } = usePOSProductCategories();

  const {
    data: myProducts = [],
    isLoading: productsLoading,
    isError: productsError,
    error: prodError,
    refetch: refetchProducts,
  } = useManagerStockedProducts();

  const {
    data: myCustomers = [],
    isLoading: customersLoading,
    refetch: refetchCustomers,
  } = useCustomers();

  const orderMutation = useAddManagerPOSOrder();

  const [productsByCategory, setProductsByCategory] = useState<ProductData[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<POSOrderPayload["order_status"]>("pending");
  const [paymentStatus, setPaymentStatus] = useState<POSOrderPayload["payment_status"]>("pending");
  const [paymentMethod, setPaymentMethod] = useState<POSOrderPayload["payment_method"]>("cash");
  const [notes, setNotes] = useState("");
  const [gridTitle, setGridTitle] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  // Financial fields
  const [discount, setDiscount] = useState(0);
  const [transportCharge, setTransportCharge] = useState(0);
  const [labourCharge, setLabourCharge] = useState(0);
  const [cgstPercentage, setCgstPercentage] = useState(0);
  const [sgstPercentage, setSgstPercentage] = useState(0);

  // Partial payment
  const [amountPaid, setAmountPaid] = useState(0);

  // Mix payment breakdown
  const [onlineAmount, setOnlineAmount] = useState(0);
  const [offlineAmount, setOfflineAmount] = useState(0);

  const searchInputRef = useRef<any>(null);

  useEffect(() => {
    setFilteredProducts(myProducts);
  }, [myProducts]);

  const isLoading = categoriesLoading || productsLoading || customersLoading;
  const hasError = categoriesError || productsError;
  const errorMessage = catError?.message || prodError?.message || "Something went wrong";

  const handleCategoryProducts = (categoryName: string) => {
    if (!categoryName) {
      setProductsByCategory([]);
      setFilteredProducts(myProducts);
      setGridTitle("");
    } else {
      const filtered = myProducts.filter((p) => p.category_name === categoryName);
      setProductsByCategory(filtered);
      setFilteredProducts(filtered);
      setGridTitle(categoryName);
    }
  };

  const handleShowAllProducts = () => {
    setProductsByCategory([]);
    setFilteredProducts(myProducts);
    setGridTitle("");
  };

  const handleSearch = (value: string) => {
    const lower = value.toLowerCase();
    const source = productsByCategory.length > 0 ? productsByCategory : myProducts;
    setFilteredProducts(source.filter((p) => p.product_name?.toLowerCase().includes(lower)));
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

  const addToCart = (product: ProductData) => {
    if (product.current_stock <= 0) {
      toast.warn("Product out of stock");
      return;
    }
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        if (exists.cartQuantity < product.current_stock) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, cartQuantity: item.cartQuantity + 1 }
              : item
          );
        } else {
          toast.warn("Cannot add more, stock limit reached");
          return prev;
        }
      }
      // Default unit price: selling_price if set, else 0
      const defaultPrice = product.selling_price ? parseFloat(product.selling_price) : 0;
      return [...prev, { ...product, cartQuantity: 1, cartUnitPrice: defaultPrice }];
    });
  };

  const updateQuantity = (id: number, delta: number, stock: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, cartQuantity: Math.min(stock, Math.max(1, item.cartQuantity + delta)) }
          : item
      )
    );
  };

  const updateUnitPrice = (id: number, price: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cartUnitPrice: price } : item))
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.cartUnitPrice * item.cartQuantity, 0);
  const cgstAmount = (subtotal * cgstPercentage) / 100;
  const sgstAmount = (subtotal * sgstPercentage) / 100;
  const grossTotal = subtotal + cgstAmount + sgstAmount + transportCharge + labourCharge - discount;
  const remainingAmount = Math.max(0, grossTotal - amountPaid);

  const handleSubmitOrder = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (cart.length === 0) {
      message.error("Cart is empty");
      return;
    }
    if (paymentMethod === "mix" && onlineAmount + offlineAmount !== amountPaid) {
      toast.error("Online + Offline amounts must equal amount paid");
      return;
    }

    const payload: POSOrderPayload = {
      customer: selectedCustomer,
      order_items: cart.map((item) => ({
        product: item.id,
        quantity: item.cartQuantity,
        unit_price: item.cartUnitPrice.toFixed(2),
      })),
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      cgst_percentage: cgstPercentage,
      sgst_percentage: sgstPercentage,
      transport_charges: transportCharge.toFixed(2),
      labour_charges: labourCharge.toFixed(2),
      discount_amount: discount.toFixed(2),
      amount_paid: paymentStatus === "paid" ? grossTotal.toFixed(2) : amountPaid.toFixed(2),
      ...(paymentMethod === "mix" && {
        online_amount: onlineAmount.toFixed(2),
        offline_amount: offlineAmount.toFixed(2),
      }),
      notes: notes || "",
    };

    orderMutation.mutate(payload, {
      onSuccess: () => {
        setCart([]);
        setSelectedCustomer(null);
        setOrderStatus("pending");
        setPaymentStatus("pending");
        setPaymentMethod("cash");
        setCgstPercentage(0);
        setSgstPercentage(0);
        setDiscount(0);
        setTransportCharge(0);
        setLabourCharge(0);
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

  if (isLoading) return (
    <>
      <PageMeta title="POS" description="Point of sale" />
      <Loader />
    </>
  );

  if (hasError) return (
    <>
      <PageMeta title="POS" description="Point of sale" />
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-400 dark:text-gray-600 mb-4">Error loading POS: {errorMessage}</p>
        <button onClick={() => { refetchProducts(); window.location.reload(); }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Retry</button>
      </div>
    </>
  );

  if (myProducts.length === 0) return (
    <>
      <PageMeta title="POS" description="Point of sale" />
      <NoPos />
    </>
  );

  return (
    <>
      <PageMeta title="POS" description="Manage and track your point of sale transactions with Inventa" />

      {/* Date and Search */}
      <div className="mb-5">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-3">
            <div className="lg:col-span-4 md:col-span-6 col-span-1">
              <div className="theme-text text-sm">Date & Time : {formatted}</div>
            </div>
            <div className="lg:col-span-8 md:col-span-6 col-span-1">
              <Search ref={searchInputRef} placeholder="Search products (Ctrl + K)"
                className="custom-search" onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* Products */}
        <section className="col-span-1 md:col-span-8">
          <PosComponentCard title="Choose Category">
            <div className="flex flex-wrap items-center justify-start gap-6">
              <button onClick={handleShowAllProducts}
                className={`px-3 py-1 rounded theme-text-2 border-brand-500 border text-sm ${!gridTitle ? "bg-brand-200 !text-black font-semibold" : ""}`}>
                All
              </button>
              {myCategories.slice(0, 12).map((category) => (
                <button key={category.id}
                  onClick={() => handleCategoryProducts(category.category_name)}
                  className={`px-3 py-1 rounded theme-text-2 border-brand-500 border text-sm ${gridTitle === category.category_name ? "bg-brand-200 !text-black font-semibold" : ""}`}>
                  {category.category_name}
                </button>
              ))}
            </div>

            <div className="my-4">
              <h2 className="font-bold mt-6 mb-4 theme-text-2">{gridTitle || "All Products"}</h2>
              <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product.id} onClick={() => addToCart(product)}
                      className="relative cursor-pointer rounded-xl p-2 border dark:border-gray-600 w-auto h-auto break-all">
                      <ProductCard product={product} />
                    </div>
                  ))
                ) : (
                  <div className="theme-text text-sm">No Products Found</div>
                )}
              </div>
            </div>
          </PosComponentCard>
        </section>

        {/* Bills */}
        <section className="col-span-1 md:col-span-4">
          <ComponentCard title="Bills">
            {/* Customer */}
            <div className="mb-4 grid lg:grid-cols-12 md:grid-cols-6 gap-2">
              <Select showSearch placeholder="Select Customer" style={{ width: "100%" }}
                value={selectedCustomer || undefined} onChange={(val) => setSelectedCustomer(val)}
                className="lg:col-span-9 md:col-span-6" loading={customersLoading}
                filterOption={(input, option) =>
                  (option?.label as string).toLowerCase().includes(input.toLowerCase())
                }
                options={myCustomers.map((c) => ({
                  label: `${c.first_name} ${c.last_name}`, value: c.id,
                }))}>
              </Select>
              <Button type="primary" className="lg:col-span-3 md:col-span-6" onClick={() => setIsVisible(true)}>
                + Add
              </Button>
            </div>

            {cart.length === 0 ? (
              <p className="theme-text text-center text-sm mt-10">Cart is Empty</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold theme-text">Cart Items</h3>
                  <Button size="small" danger onClick={clearCart} type="link">Clear Cart</Button>
                </div>

                {cart.map((item) => (
                  <div key={item.id}
                    className="border dark:border-gray-700 rounded-xl py-2 px-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium theme-text-2 text-sm">{item.product_name}</p>
                      <Button size="small"
                        className="!bg-red-500/[0.7] !text-white border dark:!border-gray-500"
                        danger onClick={() => removeItem(item.id)}>×</Button>
                    </div>

                    {/* Unit price editable */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs theme-text">Price (₹):</span>
                      <InputNumber
                        min={0} step={0.01} precision={2}
                        value={item.cartUnitPrice}
                        onChange={(val) => updateUnitPrice(item.id, val ?? 0)}
                        style={{ width: 90 }}
                        size="small"
                      />
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs theme-text">Qty:</span>
                      <div className="flex items-center gap-1">
                        <Button size="small"
                          className="!bg-white/[0.1] text-black dark:!text-white border dark:!border-gray-500"
                          onClick={() => updateQuantity(item.id, -1, item.current_stock)}>-</Button>
                        <InputNumber min={1} max={item.current_stock} value={item.cartQuantity}
                          style={{ width: 55, textAlign: "center" }} size="small"
                          onChange={(val) => {
                            if (typeof val === "number")
                              updateQuantity(item.id, val - item.cartQuantity, item.current_stock);
                          }} />
                        <Button size="small"
                          className="!bg-white/[0.1] text-black dark:!text-white border dark:!border-gray-500"
                          onClick={() => updateQuantity(item.id, 1, item.current_stock)}>+</Button>
                      </div>
                    </div>
                    <div className="text-xs theme-text text-right">
                      Item total: ₹{(item.cartUnitPrice * item.cartQuantity).toFixed(2)}
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="border-t dark:border-gray-500 pt-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="theme-text-2">Subtotal:</span>
                    <span className="theme-text-2">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs theme-text">Discount (₹):</label>
                    <input type="number" value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text"
                      placeholder="0.00" min="0" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs theme-text">Transport (₹):</label>
                    <input type="number" value={transportCharge}
                      onChange={(e) => setTransportCharge(Number(e.target.value))}
                      className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text"
                      placeholder="0.00" min="0" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs theme-text">Labour (₹):</label>
                    <input type="number" value={labourCharge}
                      onChange={(e) => setLabourCharge(Number(e.target.value))}
                      className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text"
                      placeholder="0.00" min="0" />
                  </div>

                  {/* CGST + SGST side by side */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs theme-text">CGST (%):</label>
                    <input type="number" value={cgstPercentage}
                      onChange={(e) => setCgstPercentage(Number(e.target.value))}
                      className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text"
                      placeholder="0" min="0" max="100" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs theme-text">SGST (%):</label>
                    <input type="number" value={sgstPercentage}
                      onChange={(e) => setSgstPercentage(Number(e.target.value))}
                      className="w-24 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text"
                      placeholder="0" min="0" max="100" />
                  </div>

                  {(cgstPercentage > 0 || sgstPercentage > 0) && (
                    <div className="text-xs theme-text space-y-0.5 pl-1">
                      {cgstPercentage > 0 && (
                        <div className="flex justify-between">
                          <span>CGST ({cgstPercentage}%):</span>
                          <span>₹{cgstAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {sgstPercentage > 0 && (
                        <div className="flex justify-between">
                          <span>SGST ({sgstPercentage}%):</span>
                          <span>₹{sgstAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between font-bold border-t dark:border-gray-600 pt-1 mt-1">
                    <span className="theme-text-2">Gross Total:</span>
                    <span className="theme-text-2">₹{grossTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Order & Payment controls */}
                <div className="border-t dark:border-gray-500 pt-3 space-y-3">
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

                  <div>
                    <label className="block text-sm font-medium mb-1 theme-text">Payment Status</label>
                    <Select style={{ width: "100%" }} value={paymentStatus} onChange={(val) => {
                      setPaymentStatus(val);
                      if (val === "paid") setAmountPaid(grossTotal);
                      else if (val !== "partial") setAmountPaid(0);
                    }}>
                      <Option value="pending">Pending</Option>
                      <Option value="paid">Paid</Option>
                      <Option value="partial">Partial</Option>
                      <Option value="failed">Failed</Option>
                      <Option value="refunded">Refunded</Option>
                    </Select>
                  </div>

                  {/* Partial payment fields */}
                  {paymentStatus === "partial" && (
                    <div className="space-y-1.5 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs theme-text font-medium">Amount Paid (₹):</label>
                        <input type="number" value={amountPaid}
                          onChange={(e) => setAmountPaid(Number(e.target.value))}
                          className="w-28 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text"
                          placeholder="0.00" min="0" max={grossTotal} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="theme-text">Remaining:</span>
                        <span className="font-semibold text-red-500">₹{remainingAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1 theme-text">Payment Method</label>
                    <Select style={{ width: "100%" }} value={paymentMethod} onChange={(val) => {
                      setPaymentMethod(val);
                      if (val !== "mix") { setOnlineAmount(0); setOfflineAmount(0); }
                    }}>
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
                    <div className="space-y-1.5 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs theme-text">Online (₹):</label>
                        <input type="number" value={onlineAmount}
                          onChange={(e) => setOnlineAmount(Number(e.target.value))}
                          className="w-28 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text"
                          placeholder="0.00" min="0" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs theme-text">Offline (₹):</label>
                        <input type="number" value={offlineAmount}
                          onChange={(e) => setOfflineAmount(Number(e.target.value))}
                          className="w-28 border dark:border-gray-600 rounded px-2 py-1 text-sm theme-text"
                          placeholder="0.00" min="0" />
                      </div>
                      <div className={`text-xs flex justify-between ${onlineAmount + offlineAmount === amountPaid ? "text-green-500" : "text-red-500"}`}>
                        <span>Total:</span>
                        <span>₹{(onlineAmount + offlineAmount).toFixed(2)} / ₹{amountPaid.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1 theme-text">Notes</label>
                    <TextArea rows={2} placeholder="Add order notes (optional)"
                      value={notes} onChange={(e) => setNotes(e.target.value)}
                      className="!bg-transparent theme-text dark:!border-gray-600" />
                  </div>

                  <Button type="primary" block className="mt-2" onClick={handleSubmitOrder}
                    loading={orderMutation.isPending} disabled={orderMutation.isPending}>
                    Place Order
                  </Button>
                </div>
              </div>
            )}
          </ComponentCard>
        </section>
      </section>

      {isVisible && (
        <PosAddcustomer visible={isVisible} onCancel={() => setIsVisible(false)}
          fetchCustomers={refetchCustomers} />
      )}
    </>
  );
};

export default Pos;
