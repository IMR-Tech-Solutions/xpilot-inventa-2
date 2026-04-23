import { useEffect, useState } from "react";
import { Table, Tag, Button, Space } from "antd";
import { FileSearchOutlined, StopOutlined } from "@ant-design/icons";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getBuyerS2SOrdersService, cancelS2SOrderService } from "../../services/s2sservices";
import { handleError } from "../../utils/handleError";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import { all_routes } from "../../Router/allroutes";

interface S2SOrder {
  id: number;
  order_number: string;
  seller_name: string;
  seller_business: string;
  status: string;
  total_amount: number;
  payment_status: string;
  items_count: number;
  created_at: string;
}

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

const BuyerS2SOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<S2SOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getBuyerS2SOrdersService();
      setOrders(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId: number) => {
    setCancelling(orderId);
    try {
      await cancelS2SOrderService(orderId);
      toast.success("Order cancelled.");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );
    } catch (err) {
      handleError(err);
    } finally {
      setCancelling(null);
    }
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: S2SOrder, index: number) => index + 1,
      width: 70,
    },
    { title: "Order No", dataIndex: "order_number", key: "order_number" },
    {
      title: "Shop / Seller",
      key: "seller",
      render: (_: any, r: S2SOrder) => (
        <div>
          <div className="font-medium">{r.seller_business}</div>
          <div className="text-xs text-gray-500">{r.seller_name}</div>
        </div>
      ),
    },
    { title: "Items", dataIndex: "items_count", key: "items_count", width: 70 },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s] || "default"}>
          {s?.replace(/_/g, " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Total",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (v: number) => formatINR(v),
    },
    {
      title: "Order Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (d: string) => dayjs(d).format("DD MMM YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: S2SOrder) => (
        <Space size="small">
          <Button
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => navigate(`${all_routes.s2sbuyerorderdetail.replace(":orderID", String(record.id))}`)  }
            title="View Order"
          />
          {record.status === "order_placed" && (
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              loading={cancelling === record.id}
              onClick={() => handleCancel(record.id)}
              title="Cancel Order"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta title="My Shop-to-Shop Orders" description="Orders placed to other franchise shops." />
      <PageBreadcrumb pageTitle="My S2S Orders" />
      <ButtonComponentCard title="Shop-to-Shop Purchase Orders">
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          rowKey="id"
          className="custom-orders-table"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          locale={{ emptyText: "No shop-to-shop orders yet." }}
        />
      </ButtonComponentCard>
    </div>
  );
};

export default BuyerS2SOrders;
