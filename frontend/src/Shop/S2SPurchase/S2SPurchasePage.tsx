import { useEffect, useState } from "react";
import { Select, Table, InputNumber, Button, Space, Tag, Empty, Spin } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getS2SShopListService,
  getS2SShopProductsService,
  placeS2SOrderService,
} from "../../services/s2sservices";
import { handleError } from "../../utils/handleError";
import { toast } from "react-toastify";

interface Shop {
  id: number;
  business_name: string;
  owner_name: string;
}

interface SellerProduct {
  seller_product_id: number;
  product_name: string;
  sku: string;
  unit: string;
  category: string;
  available_quantity: number;
}

interface CartItem {
  seller_product_id: number;
  product_name: string;
  unit: string;
  available_quantity: number;
  requested_quantity: number;
}

const S2SPurchasePage = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    getS2SShopListService()
      .then(setShops)
      .catch(handleError);
  }, []);

  const handleShopChange = async (shopId: number) => {
    setSelectedShop(shopId);
    setCart({});
    setProducts([]);
    setProductsLoading(true);
    try {
      const data = await getS2SShopProductsService(shopId);
      setProducts(data);
    } catch (err) {
      handleError(err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleQtyChange = (productId: number, qty: number | null) => {
    if (!qty || qty <= 0) {
      setCart((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
    } else {
      setCart((prev) => ({ ...prev, [productId]: qty }));
    }
  };

  const cartItems: CartItem[] = products
    .filter((p) => cart[p.seller_product_id] > 0)
    .map((p) => ({
      seller_product_id: p.seller_product_id,
      product_name: p.product_name,
      unit: p.unit,
      available_quantity: p.available_quantity,
      requested_quantity: cart[p.seller_product_id],
    }));

  const handlePlaceOrder = async () => {
    if (!selectedShop || cartItems.length === 0) return;
    setPlacing(true);
    try {
      await placeS2SOrderService({
        seller_id: selectedShop,
        items: cartItems.map((c) => ({
          seller_product_id: c.seller_product_id,
          requested_quantity: c.requested_quantity,
        })),
      });
      toast.success("Order placed successfully!");
      setCart({});
    } catch (err) {
      handleError(err);
    } finally {
      setPlacing(false);
    }
  };

  const productColumns = [
    { title: "Product", dataIndex: "product_name", key: "product_name" },
    { title: "SKU", dataIndex: "sku", key: "sku" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Unit", dataIndex: "unit", key: "unit", width: 80 },
    {
      title: "Available",
      dataIndex: "available_quantity",
      key: "available_quantity",
      width: 90,
      render: (v: number) => <Tag color="green">{v}</Tag>,
    },
    {
      title: "Order Qty",
      key: "qty",
      width: 140,
      render: (_: any, record: SellerProduct) => (
        <InputNumber
          min={0}
          max={record.available_quantity}
          value={cart[record.seller_product_id] || 0}
          onChange={(v) => handleQtyChange(record.seller_product_id, v)}
          style={{ width: 110 }}
        />
      ),
    },
  ];

  const cartColumns = [
    { title: "Product", dataIndex: "product_name", key: "product_name" },
    { title: "Unit", dataIndex: "unit", key: "unit" },
    {
      title: "Qty",
      dataIndex: "requested_quantity",
      key: "requested_quantity",
      render: (v: number) => <strong>{v}</strong>,
    },
  ];

  return (
    <div>
      <PageMeta title="Shop to Shop Purchase" description="Buy products from other franchise shops." />
      <PageBreadcrumb pageTitle="Shop to Shop Purchase" />

      <ButtonComponentCard title="Select a Shop">
        <div className="mb-6">
          <label className="block text-sm font-medium theme-text mb-2">
            Select Shop
          </label>
          <Select
            showSearch
            placeholder="Choose a shop to browse their products..."
            style={{ width: "100%", maxWidth: 480 }}
            value={selectedShop ?? undefined}
            onChange={handleShopChange}
            optionFilterProp="label"
            options={shops.map((s) => ({
              value: s.id,
              label: s.business_name,
            }))}
          />
        </div>

        {productsLoading && (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        )}

        {!productsLoading && selectedShop && products.length === 0 && (
          <Empty description="No available products in this shop." />
        )}

        {!productsLoading && products.length > 0 && (
          <Table
            columns={productColumns}
            dataSource={products}
            rowKey="seller_product_id"
            pagination={{ pageSize: 10 }}
            className="custom-orders-table"
            scroll={{ x: 700 }}
            size="small"
          />
        )}
      </ButtonComponentCard>

      {cartItems.length > 0 && (
        <ButtonComponentCard title={`Order Summary (${cartItems.length} item${cartItems.length > 1 ? "s" : ""})`}>
          <Table
            columns={cartColumns}
            dataSource={cartItems}
            rowKey="seller_product_id"
            pagination={false}
            size="small"
          />
          <div className="mt-4 flex justify-end">
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              loading={placing}
              onClick={handlePlaceOrder}
            >
              Place Order
            </Button>
          </div>
        </ButtonComponentCard>
      )}
    </div>
  );
};

export default S2SPurchasePage;
