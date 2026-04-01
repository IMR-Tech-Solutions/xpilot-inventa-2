import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  Modal,
  Form,
  InputNumber,
  Radio,
  Descriptions,
} from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getallmanagersshoporders,
  getmanagershoporderinvoice,
  getmanagershoporderinvoicedownload,
  getmanagershoporderdeliverychalandownload,
  updateManagerOrderStatusService,
  updateShopOrderPaymentService,
} from "../../services/shopservices";
import {
  EyeOutlined,
  DownloadOutlined,
  TruckOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import dayjs from "dayjs";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

interface ShopOrder {
  id: number;
  order_number: string;
  shop_owner_name: string;
  order_status: string;
  items_count: number;
  total_amount: number;
  payment_status: string;
  payment_method: string | null;
  amount_paid: number;
  remaining_amount: number;
  online_amount: number;
  offline_amount: number;
  created_at: string;
}

// Statuses the manager is allowed to transition TO
const MANAGER_STATUS_OPTIONS = [
  { value: "packing", label: "Packing" },
  { value: "delivery_in_progress", label: "Delivery In Progress" },
  { value: "cancelled", label: "Cancelled" },
];

// Statuses where the order status dropdown should be locked
const LOCKED_STATUSES = new Set([
  "completed",
  "cancelled",
  "delivery_in_progress",
]);

const formatINR = (v: number) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  paid: "green",
  partial: "orange",
  pending: "red",
};

const AllShopOrders = () => {
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [loadingButtons, setLoadingButtons] = useState<{
    [key: number]: {
      view?: boolean;
      invoice?: boolean;
      chalan?: boolean;
      status?: boolean;
    };
  }>({});

  // ── Payment modal state ────────────────────────────────────────────────────
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<ShopOrder | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [form] = Form.useForm();
  const watchedMethod = Form.useWatch("payment_method", form);
  const watchedAmountPaid = Form.useWatch("amount_paid", form);

  const fetchShopOrders = async () => {
    setLoading(true);
    try {
      const data = await getallmanagersshoporders();
      setShopOrders(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopOrders();
  }, []);

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      order_placed: "orange",
      partially_fulfilled: "blue",
      packing: "cyan",
      delivery_in_progress: "purple",
      completed: "green",
      cancelled: "red",
    };
    return colors[status] || "default";
  };

  // ── Status update ──────────────────────────────────────────────────────────
  const handleStatusChange = async (orderID: number, newStatus: string) => {
    setLoadingButtons((prev) => ({
      ...prev,
      [orderID]: { ...prev[orderID], status: true },
    }));
    try {
      await updateManagerOrderStatusService(orderID, newStatus);
      setShopOrders((prev) =>
        prev.map((o) =>
          o.id === orderID ? { ...o, order_status: newStatus } : o
        )
      );
      toast.success(`Order status updated to "${newStatus.replace(/_/g, " ")}"`);
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingButtons((prev) => ({
        ...prev,
        [orderID]: { ...prev[orderID], status: false },
      }));
    }
  };

  // ── Payment modal open ─────────────────────────────────────────────────────
  const openPaymentModal = (order: ShopOrder) => {
    setPaymentOrder(order);
    form.setFieldsValue({
      amount_paid: order.amount_paid || 0,
      payment_method: order.payment_method || "cash",
      online_amount: order.online_amount || 0,
      offline_amount: order.offline_amount || 0,
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentOrder) return;
    try {
      const values = await form.validateFields();
      setPaymentLoading(true);

      const payload: any = {
        amount_paid: values.amount_paid,
        payment_method: values.payment_method,
      };
      if (values.payment_method === "mix") {
        payload.online_amount = values.online_amount || 0;
        payload.offline_amount = values.offline_amount || 0;
      }

      const result = await updateShopOrderPaymentService(paymentOrder.id, payload);

      // Update local state
      setShopOrders((prev) =>
        prev.map((o) =>
          o.id === paymentOrder.id
            ? {
                ...o,
                payment_status: result.payment_status,
                payment_method: result.payment_method,
                amount_paid: result.amount_paid,
                remaining_amount: result.remaining_amount,
                online_amount: result.online_amount,
                offline_amount: result.offline_amount,
              }
            : o
        )
      );

      toast.success("Payment recorded successfully.");
      setPaymentModalOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── PDF handlers ───────────────────────────────────────────────────────────
  const handleView = async (orderID: number) => {
    setLoadingButtons((prev) => ({ ...prev, [orderID]: { ...prev[orderID], view: true } }));
    const toastId = toast.loading("Opening order details...");
    try {
      await getmanagershoporderinvoice(orderID);
      toast.update(toastId, { render: "Opened successfully!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      handleError(error);
      toast.update(toastId, { render: "Failed to open", type: "error", isLoading: false, autoClose: 2000 });
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [orderID]: { ...prev[orderID], view: false } }));
    }
  };

  const handleDownload = async (orderID: number) => {
    setLoadingButtons((prev) => ({ ...prev, [orderID]: { ...prev[orderID], invoice: true } }));
    const toastId = toast.loading("Downloading invoice...");
    try {
      await getmanagershoporderinvoicedownload(orderID);
      toast.update(toastId, { render: "Downloaded!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      handleError(error);
      toast.update(toastId, { render: "Failed", type: "error", isLoading: false, autoClose: 2000 });
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [orderID]: { ...prev[orderID], invoice: false } }));
    }
  };

  const handledownloaddeliverychalan = async (orderID: number) => {
    setLoadingButtons((prev) => ({ ...prev, [orderID]: { ...prev[orderID], chalan: true } }));
    const toastId = toast.loading("Downloading delivery challan...");
    try {
      await getmanagershoporderdeliverychalandownload(orderID);
      toast.update(toastId, { render: "Downloaded!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      handleError(error);
      toast.update(toastId, { render: "Failed", type: "error", isLoading: false, autoClose: 2000 });
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [orderID]: { ...prev[orderID], chalan: false } }));
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      width: 65,
      render: (_: any, __: ShopOrder, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Order No",
      dataIndex: "order_number",
      key: "order_number",
      sorter: (a: ShopOrder, b: ShopOrder) =>
        (a.order_number || "").localeCompare(b.order_number || ""),
    },
    {
      title: "Franchise Owner",
      dataIndex: "shop_owner_name",
      key: "shop_owner_name",
      sorter: (a: ShopOrder, b: ShopOrder) =>
        (a.shop_owner_name || "").localeCompare(b.shop_owner_name || ""),
    },
    {
      title: "Items",
      dataIndex: "items_count",
      key: "items_count",
      width: 70,
      align: "center" as const,
      render: (count: number) => (
        <span className="font-medium text-blue-600">{count}</span>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "order_status",
      key: "order_status",
      render: (currentStatus: string, record: ShopOrder) => {
        const isLocked = LOCKED_STATUSES.has(currentStatus);
        if (isLocked) {
          return (
            <Tag color={getOrderStatusColor(currentStatus)} className="capitalize">
              {currentStatus.replace(/_/g, " ").toUpperCase()}
            </Tag>
          );
        }
        return (
          <Select
            value={currentStatus}
            size="small"
            style={{ minWidth: 170 }}
            loading={loadingButtons[record.id]?.status}
            disabled={loadingButtons[record.id]?.status}
            onChange={(newStatus: string) => handleStatusChange(record.id, newStatus)}
            options={[
              {
                value: currentStatus,
                label: (
                  <Tag color={getOrderStatusColor(currentStatus)} style={{ margin: 0 }}>
                    {currentStatus.replace(/_/g, " ").toUpperCase()}
                  </Tag>
                ),
              },
              ...MANAGER_STATUS_OPTIONS.filter((opt) => opt.value !== currentStatus),
            ]}
          />
        );
      },
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      align: "right" as const,
      sorter: (a: ShopOrder, b: ShopOrder) => a.total_amount - b.total_amount,
      render: (amount: number) => (
        <span className="font-medium">{formatINR(amount)}</span>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      render: (_: any, record: ShopOrder) => {
        if (record.order_status !== "completed") {
          return <span className="text-gray-400 text-xs">—</span>;
        }
        return (
          <Space direction="vertical" size={2}>
            <Tag color={PAYMENT_STATUS_COLOR[record.payment_status] || "default"}>
              {(record.payment_status || "pending").toUpperCase()}
            </Tag>
            {record.payment_status !== "paid" && (
              <span className="text-xs text-red-500">
                Due: {formatINR(record.remaining_amount)}
              </span>
            )}
            {record.payment_status === "paid" && (
              <span className="text-xs text-green-600">
                Paid: {formatINR(record.amount_paid)}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: "Order Date",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a: ShopOrder, b: ShopOrder) =>
        dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date: string) =>
        date ? dayjs(date).format("DD MMM YYYY") : "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ShopOrder) => (
        <Space size="small" wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            loading={loadingButtons[record.id]?.view}
            onClick={() => handleView(record.id)}
            title="View Invoice"
          />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            loading={loadingButtons[record.id]?.invoice}
            onClick={() => handleDownload(record.id)}
            title="Download Invoice"
          />
          <Button
            size="small"
            icon={<TruckOutlined />}
            loading={loadingButtons[record.id]?.chalan}
            onClick={() => handledownloaddeliverychalan(record.id)}
            title="Delivery Challan"
          />
          {record.order_status === "completed" && record.payment_status !== "paid" && (
            <Button
              size="small"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => openPaymentModal(record)}
              title="Record Payment"
            >
              Payment
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // ── Computed remaining in modal ────────────────────────────────────────────
  const computedRemaining =
    paymentOrder
      ? Math.max(0, paymentOrder.total_amount - (watchedAmountPaid || 0))
      : 0;

  return (
    <div>
      <PageMeta
        title="All Franchise Orders"
        description="View all franchise orders fulfilled by managers."
      />
      <PageBreadcrumb pageTitle="All Franchise Orders" />
      <ButtonComponentCard
        title="Manager Fulfilled Orders"
        buttonlink=""
        buttontitle=""
      >
        <Table
          columns={columns}
          dataSource={shopOrders}
          loading={loading}
          rowKey="id"
          className="custom-orders-table"
          pagination={{ pageSize: 10 }}
          onChange={(pagination) => setCurrentPage(pagination.current || 1)}
          scroll={{ x: 1000 }}
          locale={{ emptyText: "No shop orders found." }}
        />
      </ButtonComponentCard>

      {/* ── Payment Modal ─────────────────────────────────────────────────── */}
      <Modal
        title={`Record Payment — ${paymentOrder?.order_number || ""}`}
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        onOk={handlePaymentSubmit}
        okText="Save Payment"
        confirmLoading={paymentLoading}
        width={480}
      >
        {paymentOrder && (
          <>
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Franchise">
                {paymentOrder.shop_owner_name}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <strong>{formatINR(paymentOrder.total_amount)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Already Paid">
                {formatINR(paymentOrder.amount_paid)}
              </Descriptions.Item>
              <Descriptions.Item label="Remaining">
                <span className="text-red-500 font-medium">
                  {formatINR(paymentOrder.remaining_amount)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical">
              <Form.Item
                name="amount_paid"
                label="Amount Paid (₹)"
                rules={[
                  { required: true, message: "Enter amount paid" },
                  {
                    validator: (_, value) =>
                      value >= 0 && value <= paymentOrder.total_amount
                        ? Promise.resolve()
                        : Promise.reject(
                            `Must be between 0 and ${formatINR(paymentOrder.total_amount)}`
                          ),
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={paymentOrder.total_amount}
                  style={{ width: "100%" }}
                  prefix="₹"
                  precision={2}
                />
              </Form.Item>

              {/* Live remaining preview */}
              <div
                style={{
                  background: computedRemaining > 0 ? "#fff7e6" : "#f6ffed",
                  border: `1px solid ${computedRemaining > 0 ? "#ffd591" : "#b7eb8f"}`,
                  borderRadius: 6,
                  padding: "6px 12px",
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                Remaining after this payment:{" "}
                <strong style={{ color: computedRemaining > 0 ? "#d46b08" : "#389e0d" }}>
                  {formatINR(computedRemaining)}
                </strong>
              </div>

              <Form.Item
                name="payment_method"
                label="Payment Method"
                rules={[{ required: true, message: "Select payment method" }]}
              >
                <Radio.Group>
                  <Radio.Button value="cash">Cash</Radio.Button>
                  <Radio.Button value="online">Online</Radio.Button>
                  <Radio.Button value="mix">Mix</Radio.Button>
                </Radio.Group>
              </Form.Item>

              {watchedMethod === "mix" && (
                <Space style={{ width: "100%" }} direction="vertical" size={0}>
                  <Form.Item
                    name="online_amount"
                    label="Online Amount (₹)"
                    rules={[{ required: true, message: "Enter online amount" }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} prefix="₹" precision={2} />
                  </Form.Item>
                  <Form.Item
                    name="offline_amount"
                    label="Cash/Offline Amount (₹)"
                    rules={[{ required: true, message: "Enter offline amount" }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} prefix="₹" precision={2} />
                  </Form.Item>
                </Space>
              )}
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AllShopOrders;
