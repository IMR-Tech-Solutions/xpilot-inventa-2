import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Table, Tag, Button, Spin, Descriptions } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { getBuyerS2SOrderDetailService, confirmS2SDeliveryService } from "../../services/s2sservices";
import { handleError } from "../../utils/handleError";
import { toast } from "react-toastify";
import dayjs from "dayjs";

interface OrderItem {
  id: number;
  product_name: string;
  sku: string;
  unit: string;
  requested_quantity: number;
  fulfilled_quantity: number | null;
  actual_price: number | null;
  total_price: number;
  item_status: string;
}

interface OrderDetail {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  seller_name: string;
  seller_business: string;
  seller_phone: string;
}

const ITEM_STATUS_COLOR: Record<string, string> = {
  pending: "orange",
  accepted: "green",
  rejected: "red",
};

const STATUS_COLOR: Record<string, string> = {
  order_placed: "blue",
  partially_accepted: "orange",
  accepted: "cyan",
  packing: "purple",
  delivery_in_progress: "geekblue",
  completed: "green",
  cancelled: "red",
};

const formatINR = (v: number) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const BuyerS2SOrderDetail = () => {
  const { orderID } = useParams<{ orderID: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getBuyerS2SOrderDetailService(Number(orderID));
        setOrder(data.order);
        setItems(data.items);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };
    if (orderID) fetch();
  }, [orderID]);

  const handleConfirm = async () => {
    if (!order) return;
    setConfirming(true);
    try {
      await confirmS2SDeliveryService(order.id);
      toast.success("Delivery confirmed! Products added to your inventory.");
      setOrder((prev) => prev ? { ...prev, status: "completed" } : prev);
    } catch (err) {
      handleError(err);
    } finally {
      setConfirming(false);
    }
  };

  const itemColumns = [
    { title: "#", key: "idx", width: 50, render: (_: any, __: OrderItem, i: number) => i + 1 },
    { title: "Product", dataIndex: "product_name", key: "product_name" },
    { title: "SKU", dataIndex: "sku", key: "sku" },
    { title: "Unit", dataIndex: "unit", key: "unit", width: 80 },
    { title: "Requested Qty", dataIndex: "requested_quantity", key: "requested_quantity", align: "center" as const },
    {
      title: "Fulfilled Qty",
      dataIndex: "fulfilled_quantity",
      key: "fulfilled_quantity",
      align: "center" as const,
      render: (v: number | null) => v != null ? <strong>{v}</strong> : "—",
    },
    {
      title: "Unit Price",
      dataIndex: "actual_price",
      key: "actual_price",
      align: "right" as const,
      render: (v: number | null) => v != null ? formatINR(v) : "—",
    },
    {
      title: "Total",
      dataIndex: "total_price",
      key: "total_price",
      align: "right" as const,
      render: (v: number) => <strong>{formatINR(v)}</strong>,
    },
    {
      title: "Status",
      dataIndex: "item_status",
      key: "item_status",
      render: (s: string) => (
        <Tag color={ITEM_STATUS_COLOR[s] || "default"}>
          {s?.toUpperCase()}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div>
      <PageMeta title={`S2S Order — ${order.order_number}`} description="Shop-to-shop order detail" />
      <PageBreadcrumb pageTitle={`S2S Order — ${order.order_number}`} />

      <div className="mb-4 flex items-center justify-between">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
        {order.status === "delivery_in_progress" && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={confirming}
            onClick={handleConfirm}
          >
            Confirm Delivery
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 mb-6">
        <h2 className="text-base font-semibold theme-text mb-4">Order Details</h2>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Order No">{order.order_number}</Descriptions.Item>
          <Descriptions.Item label="Date">{dayjs(order.created_at).format("DD MMM YYYY")}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={STATUS_COLOR[order.status] || "default"}>
              {order.status?.replace(/_/g, " ").toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Seller Shop">{order.seller_business}</Descriptions.Item>
          <Descriptions.Item label="Seller Name">{order.seller_name}</Descriptions.Item>
          <Descriptions.Item label="Seller Phone">{order.seller_phone}</Descriptions.Item>
        </Descriptions>

        <div className="mt-4 flex justify-end">
          <div className="min-w-[260px] text-sm space-y-1">
            <div className="flex justify-between py-2 border-t-2 border-gray-800 dark:border-white/30 font-bold text-base">
              <span>Order Total</span>
              <span>{formatINR(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
        <h2 className="text-base font-semibold theme-text mb-4">Order Items</h2>
        <Table
          columns={itemColumns}
          dataSource={items}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 750 }}
        />
      </div>
    </div>
  );
};

export default BuyerS2SOrderDetail;
