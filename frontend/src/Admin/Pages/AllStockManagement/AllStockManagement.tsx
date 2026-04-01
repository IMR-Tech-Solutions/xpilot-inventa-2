import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Drawer,
  Tabs,
  Descriptions,
  Statistic,
  Row,
  Col,
  Card,
  Avatar,
  Space,
  Input,
  Progress,
} from "antd";
import {
  EyeOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  DatabaseOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ButtonComponentCard from "../../Components/ButtonComponentCard";
import { handleError } from "../../../utils/handleError";
import {
  getAllStockManagementService,
  getProductStockDetailService,
} from "./stockmanagementservices";

const { Search } = Input;

const formatINR = (v: number) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

interface ProductRow {
  id: number;
  product_name: string;
  sku_code: string;
  product_image: string | null;
  category: string;
  unit: string;
  selling_price: number | null;
  current_stock: number;
  low_stock_threshold: number;
  total_added: number;
  sold_via_pos: number;
  sent_to_franchise: number;
}

interface StockEntry {
  id: number;
  quantity: number;
  purchase_price: number;
  cgst_percentage: number;
  cgst: number;
  sgst_percentage: number;
  sgst: number;
  labour_cost: number;
  transporter_cost: number;
  broker_commission: number;
  vendor: string;
  broker: string | null;
  transporter: string | null;
  added_by: string;
  manufacture_date: string;
  created_at: string;
}

interface PosSale {
  id: number;
  order_number: string;
  customer_name: string;
  sold_by: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_status: string;
  payment_status: string;
  created_at: string;
}

interface FranchiseActivity {
  id: number;
  order_number: string;
  shop_owner: string;
  shop_owner_business: string | null;
  fulfilled_by: string;
  fulfilled_quantity: number;
  manager_selling_price: number | null;
  franchise_selling_price: number | null;
  order_status: string;
  payment_status: string;
  created_at: string;
}

interface ProductDetail {
  product: ProductRow;
  stock_entries: StockEntry[];
  pos_sales: PosSale[];
  franchise_activity: FranchiseActivity[];
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  completed: "green",
  pending: "orange",
  cancelled: "red",
  confirmed: "blue",
  processing: "cyan",
  ready: "purple",
  packing: "cyan",
  delivery_in_progress: "purple",
  partially_fulfilled: "blue",
  order_placed: "orange",
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  paid: "green",
  partial: "orange",
  pending: "red",
  failed: "red",
};

const AllStockManagement = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [filtered, setFiltered] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [activeTab, setActiveTab] = useState("entries");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAllStockManagementService();
      setProducts(data);
      setFiltered(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (value: string) => {
    const q = value.toLowerCase();
    setFiltered(
      products.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          p.sku_code?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      )
    );
    setCurrentPage(1);
  };

  const openDrawer = async (productId: number) => {
    setDrawerOpen(true);
    setDetail(null);
    setActiveTab("entries");
    setDetailLoading(true);
    try {
      const data = await getProductStockDetailService(productId);
      setDetail(data);
    } catch (err) {
      handleError(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: "Sr.",
      key: "srno",
      width: 55,
      render: (_: any, __: ProductRow, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Product",
      key: "product",
      render: (_: any, record: ProductRow) => (
        <Space>
          <Avatar
            src={
              record.product_image
                ? `${import.meta.env.VITE_API_IMG_URL}${record.product_image}`
                : undefined
            }
            icon={<InboxOutlined />}
            shape="square"
            size={36}
          />
          <div>
            <div className="font-medium text-sm text-gray-800 dark:text-white/90">
              {record.product_name}
            </div>
            <div className="text-xs text-gray-400">{record.sku_code}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      filters: [...new Set(products.map((p) => p.category))].map((c) => ({
        text: c,
        value: c,
      })),
      onFilter: (value: any, record: ProductRow) => record.category === value,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      width: 80,
      render: (v: string) => <span className="text-sm">{v}</span>,
    },
    {
      title: "Total Added",
      dataIndex: "total_added",
      key: "total_added",
      align: "right" as const,
      sorter: (a: ProductRow, b: ProductRow) => a.total_added - b.total_added,
      render: (v: number) => (
        <span className="font-semibold text-blue-600">{v}</span>
      ),
    },
    {
      title: "Sold (POS)",
      dataIndex: "sold_via_pos",
      key: "sold_via_pos",
      align: "right" as const,
      sorter: (a: ProductRow, b: ProductRow) => a.sold_via_pos - b.sold_via_pos,
      render: (v: number) => (
        <span className="font-medium text-orange-500">{v}</span>
      ),
    },
    {
      title: "To Franchise",
      dataIndex: "sent_to_franchise",
      key: "sent_to_franchise",
      align: "right" as const,
      sorter: (a: ProductRow, b: ProductRow) =>
        a.sent_to_franchise - b.sent_to_franchise,
      render: (v: number) => (
        <span className="font-medium text-purple-600">{v}</span>
      ),
    },
    {
      title: "Current Stock",
      dataIndex: "current_stock",
      key: "current_stock",
      align: "right" as const,
      sorter: (a: ProductRow, b: ProductRow) =>
        a.current_stock - b.current_stock,
      render: (v: number, record: ProductRow) => (
        <Space direction="vertical" size={2}>
          <span
            className={`font-bold ${
              v <= record.low_stock_threshold
                ? "text-red-500"
                : "text-green-600"
            }`}
          >
            {v}
            {v <= record.low_stock_threshold && (
              <WarningOutlined className="ml-1 text-red-400" />
            )}
          </span>
          <Progress
            percent={
              record.total_added > 0
                ? Math.round((v / record.total_added) * 100)
                : 0
            }
            size="small"
            showInfo={false}
            strokeColor={
              v <= record.low_stock_threshold ? "#f5222d" : "#52c41a"
            }
            style={{ width: 70 }}
          />
        </Space>
      ),
    },
    {
      title: "Selling Price",
      dataIndex: "selling_price",
      key: "selling_price",
      align: "right" as const,
      render: (v: number | null) =>
        v ? (
          <span className="font-medium">{formatINR(v)}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ProductRow) => (
        <Button
          size="small"
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => openDrawer(record.id)}
        >
          View
        </Button>
      ),
    },
  ];

  // ── Drawer Tab: Stock Entries ──────────────────────────────────────────────
  const entriesTab = detail && (
    <Table
      size="small"
      dataSource={detail.stock_entries}
      rowKey="id"
      pagination={{ pageSize: 5 }}
      scroll={{ x: 800 }}
      locale={{ emptyText: "No stock entries." }}
      columns={[
        {
          title: "Date",
          dataIndex: "created_at",
          key: "created_at",
          render: (v: string) => dayjs(v).format("DD MMM YYYY"),
        },
        {
          title: "Qty",
          dataIndex: "quantity",
          key: "quantity",
          render: (v: number) => <span className="font-semibold text-blue-600">{v}</span>,
        },
        {
          title: "Purchase Price",
          dataIndex: "purchase_price",
          key: "purchase_price",
          render: (v: number) => formatINR(v),
        },
        {
          title: "CGST",
          key: "cgst",
          render: (_: any, r: StockEntry) =>
            r.cgst_percentage > 0 ? `${r.cgst_percentage}% (${formatINR(r.cgst)})` : "—",
        },
        {
          title: "SGST",
          key: "sgst",
          render: (_: any, r: StockEntry) =>
            r.sgst_percentage > 0 ? `${r.sgst_percentage}% (${formatINR(r.sgst)})` : "—",
        },
        {
          title: "Transport Cost",
          dataIndex: "transporter_cost",
          key: "transporter_cost",
          render: (v: number) => (v > 0 ? formatINR(v) : "—"),
        },
        {
          title: "Broker Commission",
          dataIndex: "broker_commission",
          key: "broker_commission",
          render: (v: number) => (v > 0 ? formatINR(v) : "—"),
        },
        {
          title: "Vendor",
          dataIndex: "vendor",
          key: "vendor",
          render: (v: string) => <Tag color="geekblue">{v}</Tag>,
        },
        {
          title: "Broker",
          dataIndex: "broker",
          key: "broker",
          render: (v: string | null) => v ? <Tag color="purple">{v}</Tag> : "—",
        },
        {
          title: "Transporter",
          dataIndex: "transporter",
          key: "transporter",
          render: (v: string | null) => v ? <Tag>{v}</Tag> : "—",
        },
        {
          title: "Added By",
          dataIndex: "added_by",
          key: "added_by",
        },
        {
          title: "Mfg Date",
          dataIndex: "manufacture_date",
          key: "manufacture_date",
          render: (v: string) => dayjs(v).format("DD MMM YYYY"),
        },
      ]}
    />
  );

  // ── Drawer Tab: POS Sales ──────────────────────────────────────────────────
  const posTab = detail && (
    <div>
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Qty Sold"
              value={detail.pos_sales.reduce((s, i) => s + i.quantity, 0)}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total POS Revenue"
              value={detail.pos_sales.reduce((s, i) => s + i.total_price, 0)}
              prefix="₹"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Transactions"
              value={detail.pos_sales.length}
            />
          </Card>
        </Col>
      </Row>
      <Table
        size="small"
        dataSource={detail.pos_sales}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 700 }}
        locale={{ emptyText: "No POS sales for this product." }}
        columns={[
          { title: "Order No", dataIndex: "order_number", key: "order_number" },
          { title: "Customer", dataIndex: "customer_name", key: "customer_name" },
          { title: "Sold By", dataIndex: "sold_by", key: "sold_by" },
          {
            title: "Qty",
            dataIndex: "quantity",
            key: "quantity",
            render: (v: number) => <span className="font-semibold text-orange-500">{v}</span>,
          },
          {
            title: "Unit Price",
            dataIndex: "unit_price",
            key: "unit_price",
            render: (v: number) => formatINR(v),
          },
          {
            title: "Total",
            dataIndex: "total_price",
            key: "total_price",
            render: (v: number) => <span className="font-medium">{formatINR(v)}</span>,
          },
          {
            title: "Order Status",
            dataIndex: "order_status",
            key: "order_status",
            render: (v: string) => (
              <Tag color={ORDER_STATUS_COLOR[v] || "default"}>
                {v.replace(/_/g, " ").toUpperCase()}
              </Tag>
            ),
          },
          {
            title: "Payment",
            dataIndex: "payment_status",
            key: "payment_status",
            render: (v: string) => (
              <Tag color={PAYMENT_STATUS_COLOR[v] || "default"}>{v.toUpperCase()}</Tag>
            ),
          },
          {
            title: "Date",
            dataIndex: "created_at",
            key: "created_at",
            render: (v: string) => dayjs(v).format("DD MMM YYYY"),
          },
        ]}
      />
    </div>
  );

  // ── Drawer Tab: Franchise Activity ─────────────────────────────────────────
  const franchiseTab = detail && (
    <div>
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Qty Sent"
              value={detail.franchise_activity.reduce(
                (s, i) => s + i.fulfilled_quantity,
                0
              )}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Franchise Transactions"
              value={detail.franchise_activity.length}
            />
          </Card>
        </Col>
      </Row>
      <Table
        size="small"
        dataSource={detail.franchise_activity}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 800 }}
        locale={{ emptyText: "No franchise activity for this product." }}
        columns={[
          { title: "Order No", dataIndex: "order_number", key: "order_number" },
          {
            title: "Shop Owner",
            key: "shop_owner",
            render: (_: any, r: FranchiseActivity) => (
              <div>
                <div className="font-medium">{r.shop_owner}</div>
                {r.shop_owner_business && (
                  <div className="text-xs text-gray-400">{r.shop_owner_business}</div>
                )}
              </div>
            ),
          },
          { title: "Fulfilled By", dataIndex: "fulfilled_by", key: "fulfilled_by" },
          {
            title: "Qty Sent",
            dataIndex: "fulfilled_quantity",
            key: "fulfilled_quantity",
            render: (v: number) => (
              <span className="font-semibold text-purple-600">{v}</span>
            ),
          },
          {
            title: "Manager Price",
            dataIndex: "manager_selling_price",
            key: "manager_selling_price",
            render: (v: number | null) =>
              v ? (
                <span className="font-medium text-blue-600">{formatINR(v)}</span>
              ) : "—",
          },
          {
            title: "Franchise Selling Price",
            dataIndex: "franchise_selling_price",
            key: "franchise_selling_price",
            render: (v: number | null, r: FranchiseActivity) => {
              if (!v) return "—";
              const margin =
                r.manager_selling_price && r.manager_selling_price > 0
                  ? (((v - r.manager_selling_price) / r.manager_selling_price) * 100).toFixed(1)
                  : null;
              return (
                <Space direction="vertical" size={0}>
                  <span className="font-medium text-green-600">{formatINR(v)}</span>
                  {margin && (
                    <span className="text-xs text-gray-400">+{margin}% margin</span>
                  )}
                </Space>
              );
            },
          },
          {
            title: "Order Status",
            dataIndex: "order_status",
            key: "order_status",
            render: (v: string) => (
              <Tag color={ORDER_STATUS_COLOR[v] || "default"}>
                {v.replace(/_/g, " ").toUpperCase()}
              </Tag>
            ),
          },
          {
            title: "Payment",
            dataIndex: "payment_status",
            key: "payment_status",
            render: (v: string) => (
              <Tag color={PAYMENT_STATUS_COLOR[v] || "default"}>{v.toUpperCase()}</Tag>
            ),
          },
          {
            title: "Date",
            dataIndex: "created_at",
            key: "created_at",
            render: (v: string) => dayjs(v).format("DD MMM YYYY"),
          },
        ]}
      />
    </div>
  );

  const drawerProduct = detail?.product;

  return (
    <div>
      <PageMeta
        title="Stock Management"
        description="Admin view of all product stock movement — added, sold via POS, sent to franchise."
      />
      <PageBreadcrumb pageTitle="Stock Management" />

      <ButtonComponentCard title="All Stock Movement" buttontitle="" buttonlink="">
        <div className="mb-4">
          <Search
            placeholder="Search by product, SKU, category..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
            style={{ maxWidth: 400 }}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey="id"
          className="custom-orders-table"
          pagination={{ pageSize }}
          onChange={(pagination) => setCurrentPage(pagination.current || 1)}
          scroll={{ x: 1100 }}
          locale={{ emptyText: "No products found." }}
        />
      </ButtonComponentCard>

      {/* ── Product Detail Drawer ───────────────────────────────────────────── */}
      <Drawer
        title={
          drawerProduct ? (
            <Space>
              <Avatar
                src={
                  drawerProduct.product_image
                    ? `${import.meta.env.VITE_API_IMG_URL}${drawerProduct.product_image}`
                    : undefined
                }
                icon={<DatabaseOutlined />}
                shape="square"
                size={40}
              />
              <div>
                <div className="font-semibold">{drawerProduct.product_name}</div>
                <div className="text-xs text-gray-400">
                  {drawerProduct.sku_code} &middot; {drawerProduct.category}
                </div>
              </div>
            </Space>
          ) : (
            "Stock Details"
          )
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={860}
        loading={detailLoading}
      >
        {detail && (
          <>
            {/* Summary bar */}
            <Row gutter={[12, 12]} className="mb-4">
              <Col xs={12} sm={6}>
                <Card size="small" style={{ borderColor: "#91caff" }}>
                  <Statistic
                    title="Total Added"
                    value={detail.stock_entries.reduce((s, e) => s + e.quantity, 0)}
                    valueStyle={{ color: "#1677ff" }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ borderColor: "#ffd591" }}>
                  <Statistic
                    title="Sold via POS"
                    value={detail.pos_sales.reduce((s, i) => s + i.quantity, 0)}
                    valueStyle={{ color: "#d46b08" }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ borderColor: "#d3adf7" }}>
                  <Statistic
                    title="Sent to Franchise"
                    value={detail.franchise_activity.reduce(
                      (s, i) => s + i.fulfilled_quantity,
                      0
                    )}
                    valueStyle={{ color: "#722ed1" }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card
                  size="small"
                  style={{
                    borderColor:
                      detail.product.current_stock <= detail.product.low_stock_threshold
                        ? "#ffa39e"
                        : "#b7eb8f",
                  }}
                >
                  <Statistic
                    title="Current Stock"
                    value={detail.product.current_stock}
                    valueStyle={{
                      color:
                        detail.product.current_stock <= detail.product.low_stock_threshold
                          ? "#cf1322"
                          : "#3f8600",
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Product quick info */}
            <Descriptions size="small" column={3} className="mb-4" bordered>
              <Descriptions.Item label="Unit">{detail.product.unit}</Descriptions.Item>
              <Descriptions.Item label="Selling Price">
                {detail.product.selling_price ? formatINR(detail.product.selling_price) : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Low Stock Alert">
                {detail.product.low_stock_threshold}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "entries",
                  label: `Stock Entries (${detail.stock_entries.length})`,
                  icon: <InboxOutlined />,
                  children: entriesTab,
                },
                {
                  key: "pos",
                  label: `POS Sales (${detail.pos_sales.length})`,
                  icon: <ShoppingCartOutlined />,
                  children: posTab,
                },
                {
                  key: "franchise",
                  label: `Franchise (${detail.franchise_activity.length})`,
                  icon: <ShopOutlined />,
                  children: franchiseTab,
                },
              ]}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default AllStockManagement;
