import { useState, useEffect, useRef } from "react";
import ComponentCard from "../components/common/ComponentCard";
import PosComponentCard from "../POS/PosComponentCard";
import PageMeta from "../components/common/PageMeta";
import { ProductData, ShopOrderPayload } from "../types/types";
import {
  useShopCategories,
  useShopProducts,
  useAddShopOrder,
} from "../hooks/useShopHook";
import ShopProductCard from "./ShopProductCard";
import NoShop from "./NoShop";
import Loader from "../Loader/Loader";
import { Input, Button, message, InputNumber } from "antd";

const { Search } = Input;
const { TextArea } = Input;

// Stable empty arrays — prevents useEffect from firing on every render
// when React Query data is still undefined ([] !== [] by reference)
const EMPTY_CATEGORIES: never[] = [];
const EMPTY_PRODUCTS: never[] = [];

const Shop = () => {
  const {
    data: myCategories = EMPTY_CATEGORIES,
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: catError,
  } = useShopCategories();

  const {
    data: myProducts = EMPTY_PRODUCTS,
    isLoading: productsLoading,
    isError: productsError,
    error: prodError,
    refetch: refetchProducts,
  } = useShopProducts();

  const orderMutation = useAddShopOrder();

  const [productsByCategory, setProductsByCategory] = useState<ProductData[]>(
    []
  );
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [gridTitle, setGridTitle] = useState<string>("");

  const searchInputRef = useRef<any>(null);
  useEffect(() => {
    setFilteredProducts(myProducts);
  }, [myProducts]);

  const isLoading = categoriesLoading || productsLoading;
  const hasError = categoriesError || productsError;
  const errorMessage =
    catError?.message || prodError?.message || "Something went wrong";

  const handleCategoryProducts = (categoryName: string) => {
    const title = myCategories.find((x) => x.category_name === categoryName);
    setGridTitle(title?.category_name || "");

    if (!categoryName) {
      setProductsByCategory([]);
      setFilteredProducts(myProducts);
      setGridTitle("");
    } else {
      const filtered = myProducts.filter(
        (product) => product.category_name === categoryName
      );
      setProductsByCategory(filtered);
      setFilteredProducts(filtered);
    }
  };

  const handleShowAllProducts = () => {
    setProductsByCategory([]);
    setFilteredProducts(myProducts);
    setGridTitle("");
  };

  const handleSearch = (value: string) => {
    const lowerValue = value.toLowerCase();
    let sourceProducts =
      productsByCategory.length > 0 ? productsByCategory : myProducts;

    const filtered = sourceProducts.filter((product) =>
      product.product_name?.toLowerCase().includes(lowerValue)
    );

    setFilteredProducts(filtered);
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
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, item.quantity + delta),
            }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      message.error("Cart is empty");
      return;
    }

    const payload: ShopOrderPayload = {
      order_items: cart.map((item) => ({
        product: item.id,
        requested_quantity: item.quantity,
      })),
      notes: notes || "",
    };

    orderMutation.mutate(payload, {
      onSuccess: () => {
        setCart([]);
        setNotes("");
      },
    });
  };

  const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const formatted = date.toLocaleString("en-US", options);

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="Shop"
          description="Order products from managers for your shop with Inventa"
        />
        <Loader />
      </>
    );
  }

  if (hasError) {
    return (
      <>
        <PageMeta
          title="Shop"
          description="Order products from managers for your shop with Inventa"
        />
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-400 dark:text-gray-600 mb-4">
            Error loading shop: {errorMessage}
          </p>
          <button
            onClick={() => {
              refetchProducts();
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  if (myProducts.length === 0) {
    return (
      <>
        <PageMeta
          title="Shop"
          description="Order products from managers for your shop with Inventa"
        />
        <NoShop />
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Shop"
        description="Order products from managers for your shop with Inventa"
      />

      <div className="mb-5">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-3">
            <div className="lg:col-span-4 md:col-span-6 col-span-1">
              <div className="theme-text text-sm">
                Date & Time : {formatted}
              </div>
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
        <section className="col-span-1 md:col-span-8">
          <PosComponentCard title="Choose Category">
            <div className="flex flex-wrap items-center justify-start gap-6">
              <button
                onClick={handleShowAllProducts}
                className={`px-3 py-1 rounded theme-text-2 border-brand-500 border text-sm ${
                  !gridTitle ? "bg-brand-200 !text-black font-semibold" : ""
                }`}
              >
                All
              </button>
              {myCategories.slice(0, 12).map((category) => (
                <button
                  onClick={() => handleCategoryProducts(category.category_name)}
                  key={category.id}
                  className={`px-3 py-1 rounded theme-text-2 border-brand-500 border text-sm ${
                    gridTitle === category.category_name
                      ? "bg-brand-200 !text-black font-semibold"
                      : ""
                  }`}
                >
                  {category.category_name}
                </button>
              ))}
            </div>

            <div className="my-4">
              <h2 className="font-bold mt-6 mb-4 theme-text-2">
                {gridTitle ? gridTitle : "All Products"}
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
                      <ShopProductCard product={product} />
                    </div>
                  ))
                ) : (
                  <div className="theme-text text-sm">No Products Found</div>
                )}
              </div>
            </div>
          </PosComponentCard>
        </section>

        <section className="col-span-1 md:col-span-4">
          <ComponentCard title="Order Summary">
            {cart.length === 0 ? (
              <p className="theme-text text-center text-sm mt-10">
                Cart is Empty
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold theme-text">Requested Items</h3>
                  <Button size="small" danger onClick={clearCart} type="link">
                    Clear Cart
                  </Button>
                </div>

                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border dark:border-gray-700 rounded-xl py-2 px-4"
                  >
                    <div>
                      <p className="font-medium theme-text-2 text-sm mb-1">
                        {item.product_name}
                      </p>
                      <p className="text-xs theme-text">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        className="!bg-white/[0.1] text-black dark:!text-white border dark:!border-gray-500"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        -
                      </Button>
                      <InputNumber
                        min={1}
                        value={item.quantity}
                        style={{ width: 60, textAlign: "center" }}
                        onChange={(val) => {
                          if (typeof val === "number") {
                            updateQuantity(item.id, val - item.quantity);
                          }
                        }}
                      />
                      <Button
                        size="small"
                        className="!bg-white/[0.1] text-black dark:!text-white border dark:!border-gray-500"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </Button>
                      <Button
                        size="small"
                        className="!bg-red-500/[0.7] !text-white border dark:!border-gray-500"
                        danger
                        onClick={() => removeItem(item.id)}
                      >
                        x
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="border-t dark:border-gray-500 pt-3">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 theme-text">
                      Order Notes
                    </label>
                    <TextArea
                      rows={3}
                      placeholder="Add Order notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="!bg-transparent theme-text dark:!border-gray-600"
                    />
                  </div>

                  <Button
                    type="primary"
                    block
                    className="mt-4"
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
    </>
  );
};

export default Shop;
