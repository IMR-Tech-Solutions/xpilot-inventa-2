import { useEffect, useState } from "react";
import {
  Table, Tag, Button, Space, Modal, Form, InputNumber,
  Select, Input, Divider, Radio, Descriptions,
} from "antd";
import {
  EyeOutlined, CheckOutlined, CloseOutlined,
  DollarOutlined, PlusOutlined, DownloadOutlined,
} from "@ant-design/icons";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getSellerS2SOrdersService,
  getSellerS2SOrderDetailService,
  acceptS2SItemService,
  rejectS2SItemService,
  updateS2SOrderStatusService,
  recordS2SPaymentService,
  viewS2SInvoiceService,
  downloadS2SInvoiceService,
} from "../../services/s2sservices";
import { getMyActiveTransporterService } from "../../services/transporterservices";
import { handleError } from "../../utils/handleError";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { TransporterData } from "../../types/types";

interface S2SSellerOrder {
  id: number;
  order_number: string;
  buyer_name: string;
  buyer_business: string;
  status: string;
  total_amount: number;
  payment_status: string;
  payment_method: string | null;
  amount_paid: number;
  remaining_amount: number;
  online_amount: number;
  offline_amount: number;
  items_count: number;
  created_at: string;
}

interface OrderItem {
  id: number;
  product_name: string;
  sku: string;
  unit: string;
  requested_quantity: number;
  available_quantity: number;
  fulfilled_quantity: number | null;
  actual_price: number | null;
  total_price: number;
  item_status: string;
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

const LOCKED_STATUSES = new Set(["completed", "cancelled", "delivery_in_progress"]);
const SELLER_STATUS_OPTIONS = [
  { value: "packing", label: "Packing" },
  { value: "delivery_in_progress", label: "Delivery In Progress" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS_COLOR: Record<string, string> = { paid: "green", partial: "orange", pending: "red" };
const formatINR = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const SellerS2SOrders = () => {
  const [orders, setOrders] = useState<S2SSellerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<Record<number, boolean>>({});

  // Detail/accept modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<S2SSellerOrder | null>(null);
  const [detailItems, setDetailItems] = useState<OrderItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acceptModal, setAcceptModal] = useState<{ open: boolean; item: OrderItem | null }>({ open: false, item: null });
  const [acceptForm] = Form.useForm();
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState<number | null>(null);

  // Delivery modal
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryOrderId, setDeliveryOrderId] = useState<number | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [transporters, setTransporters] = useState<TransporterData[]>([]);
  const [selectedTransporter, setSelectedTransporter] = useState<TransporterData | null>(null);
  const [deliveryFrom, setDeliveryFrom] = useState("");
  const [deliveryTo, setDeliveryTo] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("");
  const [deliveryForm] = Form.useForm();

  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<S2SSellerOrder | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState<Record<number, "view" | "download" | null>>({});
  const [paymentForm] = Form.useForm();
  const watchedMethod = Form.useWatch("payment_method", paymentForm);
  const watchedAmountPaid = Form.useWatch("amount_paid", paymentForm);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getSellerS2SOrdersService();
      setOrders(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // ── View order detail ────────────────────────────────────────────────────
  const openDetail = async (order: S2SSellerOrder) => {
    setDetailOrder(order);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const data = await getSellerS2SOrderDetailService(order.id);
      setDetailItems(data.items);
    } catch (err) {
      handleError(err);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Accept item ──────────────────────────────────────────────────────────
  const openAcceptModal = (item: OrderItem) => {
    setAcceptModal({ open: true, item });
    acceptForm.setFieldsValue({
      offered_quantity: item.requested_quantity,
      offered_price: undefined,
    });
  };

  const handleAccept = async () => {
    if (!detailOrder || !acceptModal.item) return;
    try {
      const values = await acceptForm.validateFields();
      setAcceptLoading(true);
      await acceptS2SItemService(detailOrder.id, acceptModal.item.id, {
        offered_quantity: values.offered_quantity,
        offered_price: values.offered_price,
      });
      toast.success("Item accepted.");
      setAcceptModal({ open: false, item: null });
      const data = await getSellerS2SOrderDetailService(detailOrder.id);
      setDetailItems(data.items);
      fetchOrders();
    } catch (err) {
      handleError(err);
    } finally {
      setAcceptLoading(false);
    }
  };

  // ── Reject item ──────────────────────────────────────────────────────────
  const handleReject = async (item: OrderItem) => {
    if (!detailOrder) return;
    setRejectLoading(item.id);
    try {
      await rejectS2SItemService(detailOrder.id, item.id);
      toast.success("Item rejected.");
      const data = await getSellerS2SOrderDetailService(detailOrder.id);
      setDetailItems(data.items);
      fetchOrders();
    } catch (err) {
      handleError(err);
    } finally {
      setRejectLoading(null);
    }
  };

  // ── Status change ────────────────────────────────────────────────────────
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (newStatus === "delivery_in_progress") {
      if (transporters.length === 0) {
        try { const d = await getMyActiveTransporterService(); setTransporters(d); } catch (_) {}
      }
      setDeliveryOrderId(orderId);
      setSelectedTransporter(null); setDeliveryFrom(""); setDeliveryTo(""); setDeliveryCost("");
      deliveryForm.resetFields();
      setDeliveryModalOpen(true);
      return;
    }
    setStatusLoading((p) => ({ ...p, [orderId]: true }));
    try {
      await updateS2SOrderStatusService(orderId, newStatus);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Status updated to "${newStatus.replace(/_/g, " ")}"`);
    } catch (err) { handleError(err); }
    finally { setStatusLoading((p) => ({ ...p, [orderId]: false })); }
  };

  const handleDeliveryConfirm = async () => {
    if (!deliveryOrderId) return;
    setDeliveryLoading(true);
    try {
      const details: Record<string, any> = {};
      if (selectedTransporter) details.delivery_transporter = selectedTransporter.id;
      if (deliveryFrom.trim()) details.delivery_from = deliveryFrom.trim();
      if (deliveryTo.trim()) details.delivery_to = deliveryTo.trim();
      if (deliveryCost) details.delivery_transporter_cost = deliveryCost;
      await updateS2SOrderStatusService(deliveryOrderId, "delivery_in_progress", details);
      setOrders((prev) => prev.map((o) => o.id === deliveryOrderId ? { ...o, status: "delivery_in_progress" } : o));
      toast.success('Status updated to "Delivery In Progress"');
      setDeliveryModalOpen(false);
    } catch (err) { handleError(err); }
    finally { setDeliveryLoading(false); }
  };

  // ── Payment ──────────────────────────────────────────────────────────────
  const openPaymentModal = (order: S2SSellerOrder) => {
    setPaymentOrder(order);
    paymentForm.setFieldsValue({ amount_paid: 0, payment_method: "cash", online_amount: 0, offline_amount: 0 });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentOrder) return;
    try {
      const values = await paymentForm.validateFields();
      setPaymentLoading(true);
      const payload: any = { amount_paid: values.amount_paid, payment_method: values.payment_method };
      if (values.payment_method === "mix") {
        payload.online_amount = values.online_amount || 0;
        payload.offline_amount = values.offline_amount || 0;
      }
      const result = await recordS2SPaymentService(paymentOrder.id, payload);
      setOrders((prev) => prev.map((o) => o.id === paymentOrder.id
        ? { ...o, payment_status: result.payment_status, payment_method: result.payment_method, amount_paid: result.amount_paid, remaining_amount: result.remaining_amount }
        : o
      ));
      toast.success("Payment recorded.");
      setPaymentModalOpen(false);
    } catch (err) { handleError(err); }
    finally { setPaymentLoading(false); }
  };

  const computedRemaining = paymentOrder
    ? Math.max(0, paymentOrder.remaining_amount - (watchedAmountPaid || 0))
    : 0;

  // ── Item columns inside detail modal ─────────────────────────────────────
  const itemColumns = [
    { title: "#", key: "idx", width: 40, render: (_: any, __: OrderItem, i: number) => i + 1 },
    { title: "Product", dataIndex: "product_name", key: "product_name" },
    { title: "Req. Qty", dataIndex: "requested_quantity", key: "requested_quantity", align: "center" as const },
    { title: "Avail. Stock", dataIndex: "available_quantity", key: "available_quantity", align: "center" as const,
      render: (v: number) => <Tag color={v > 0 ? "green" : "red"}>{v}</Tag> },
    { title: "Fulfill Qty", dataIndex: "fulfilled_quantity", key: "fulfilled_quantity", align: "center" as const,
      render: (v: number | null) => v != null ? <strong>{v}</strong> : "—" },
    { title: "Price", dataIndex: "actual_price", key: "actual_price", align: "right" as const,
      render: (v: number | null) => v != null ? formatINR(v) : "—" },
    { title: "Status", dataIndex: "item_status", key: "item_status",
      render: (s: string) => <Tag color={s === "accepted" ? "green" : s === "rejected" ? "red" : "orange"}>{s?.toUpperCase()}</Tag> },
    {
      title: "Actions", key: "actions",
      render: (_: any, item: OrderItem) => item.item_status !== "pending" ? null : (
        <Space size="small">
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openAcceptModal(item)}>Accept</Button>
          <Button size="small" danger icon={<CloseOutlined />} loading={rejectLoading === item.id} onClick={() => handleReject(item)}>Reject</Button>
        </Space>
      ),
    },
  ];

  const columns = [
    { title: "Sr. No", key: "srno", width: 65, render: (_: any, __: S2SSellerOrder, i: number) => i + 1 },
    { title: "Order No", dataIndex: "order_number", key: "order_number" },
    {
      title: "Buyer Shop", key: "buyer",
      render: (_: any, r: S2SSellerOrder) => (
        <div><div className="font-medium">{r.buyer_business}</div><div className="text-xs text-gray-500">{r.buyer_name}</div></div>
      ),
    },
    { title: "Items", dataIndex: "items_count", key: "items_count", width: 65, align: "center" as const },
    {
      title: "Order Status", dataIndex: "status", key: "status",
      render: (currentStatus: string, record: S2SSellerOrder) => {
        if (LOCKED_STATUSES.has(currentStatus) || currentStatus === "order_placed" || currentStatus === "partially_accepted") {
          return <Tag color={STATUS_COLOR[currentStatus] || "default"}>{currentStatus.replace(/_/g, " ").toUpperCase()}</Tag>;
        }
        return (
          <Select
            value={currentStatus} size="small" style={{ minWidth: 170 }}
            loading={statusLoading[record.id]}
            disabled={statusLoading[record.id]}
            onChange={(v) => handleStatusChange(record.id, v)}
            options={[
              { value: currentStatus, label: <Tag color={STATUS_COLOR[currentStatus]} style={{ margin: 0 }}>{currentStatus.replace(/_/g, " ").toUpperCase()}</Tag> },
              ...SELLER_STATUS_OPTIONS.filter((o) => o.value !== currentStatus),
            ]}
          />
        );
      },
    },
    {
      title: "Total", dataIndex: "total_amount", key: "total_amount", align: "right" as const,
      render: (v: number) => <span className="font-medium">{formatINR(v)}</span>,
    },
    {
      title: "Payment", key: "payment",
      render: (_: any, record: S2SSellerOrder) => {
        if (record.status !== "completed") return <span className="text-gray-400 text-xs">—</span>;
        return (
          <Space direction="vertical" size={2}>
            <Tag color={PAYMENT_STATUS_COLOR[record.payment_status] || "default"}>
              {(record.payment_status || "pending").toUpperCase()}
            </Tag>
            {record.payment_status !== "paid" && (
              <span className="text-xs text-red-500">Due: {formatINR(record.remaining_amount)}</span>
            )}
          </Space>
        );
      },
    },
    { title: "Order Date", dataIndex: "created_at", key: "created_at",
      render: (d: string) => dayjs(d).format("DD MMM YYYY") },
    {
      title: "Actions", key: "actions",
      render: (_: any, record: S2SSellerOrder) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)} title="View & Accept/Reject Items" />
          {record.status === "completed" && (
            <>
              <Button size="small" icon={<EyeOutlined />} loading={invoiceLoading[record.id] === "view"} onClick={async () => { setInvoiceLoading((p) => ({ ...p, [record.id]: "view" })); try { await viewS2SInvoiceService(record.id); } catch (err) { handleError(err); } finally { setInvoiceLoading((p) => ({ ...p, [record.id]: null })); } }} title="View Invoice" />
              <Button size="small" icon={<DownloadOutlined />} loading={invoiceLoading[record.id] === "download"} onClick={async () => { setInvoiceLoading((p) => ({ ...p, [record.id]: "download" })); try { await downloadS2SInvoiceService(record.id); } catch (err) { handleError(err); } finally { setInvoiceLoading((p) => ({ ...p, [record.id]: null })); } }} title="Download Invoice" />
            </>
          )}
          {record.status === "completed" && record.payment_status !== "paid" && (
            <Button size="small" type="primary" icon={<DollarOutlined />} onClick={() => openPaymentModal(record)}>Payment</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta title="Incoming S2S Orders" description="Orders placed to your shop by other franchise owners." />
      <PageBreadcrumb pageTitle="Incoming Shop-to-Shop Orders" />
      <ButtonComponentCard title="Incoming Orders">
        <Table columns={columns} dataSource={orders} loading={loading} rowKey="id"
          className="custom-orders-table" pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }} locale={{ emptyText: "No incoming orders." }} />
      </ButtonComponentCard>

      {/* ── Order Detail / Accept-Reject Modal ─────────────────────────────── */}
      <Modal
        title={`Order Items — ${detailOrder?.order_number || ""}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={<Button onClick={() => setDetailModalOpen(false)}>Close</Button>}
        width={900}
      >
        {detailOrder && (
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Buyer: <strong>{detailOrder.buyer_business}</strong> ({detailOrder.buyer_name})
          </div>
        )}
        <Table columns={itemColumns} dataSource={detailItems} rowKey="id"
          loading={detailLoading} pagination={false} size="small" scroll={{ x: 700 }} />
      </Modal>

      {/* ── Accept Item Modal ───────────────────────────────────────────────── */}
      <Modal
        title={`Accept — ${acceptModal.item?.product_name || ""}`}
        open={acceptModal.open}
        onCancel={() => setAcceptModal({ open: false, item: null })}
        onOk={handleAccept}
        okText="Accept"
        confirmLoading={acceptLoading}
        width={420}
      >
        {acceptModal.item && (
          <Form form={acceptForm} layout="vertical">
            <Form.Item label={`Quantity (max ${acceptModal.item.requested_quantity})`} name="offered_quantity"
              rules={[{ required: true, message: "Enter quantity" }]}>
              <InputNumber min={1} max={acceptModal.item.requested_quantity} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Price per Unit (₹)" name="offered_price"
              rules={[{ required: true, message: "Enter price" }]}>
              <InputNumber min={0.01} precision={2} prefix="₹" style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* ── Delivery Modal ─────────────────────────────────────────────────── */}
      <Modal title="Set Delivery in Progress" open={deliveryModalOpen}
        onCancel={() => setDeliveryModalOpen(false)} onOk={handleDeliveryConfirm}
        okText="Confirm & Update" confirmLoading={deliveryLoading} width={500}>
        <p className="text-xs text-gray-500 mb-4">All fields optional — skip and confirm directly.</p>
        <Form form={deliveryForm} layout="vertical">
          <Form.Item label="Transporter">
            <Select allowClear showSearch placeholder="Select transporter (optional)"
              optionFilterProp="label"
              value={selectedTransporter?.id ?? undefined}
              onChange={(val) => setSelectedTransporter(transporters.find((t) => t.id === val) ?? null)}
              options={transporters.map((t) => ({ value: t.id, label: `${t.transporter_name}${t.contact_number ? ` — ${t.contact_number}` : ""}` }))}
              dropdownRender={(menu) => (<>{menu}<Divider style={{ margin: "4px 0" }} /><div className="px-2 py-1"><Button type="link" icon={<PlusOutlined />} size="small">Add New Transporter</Button></div></>)}
            />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="From"><Input value={deliveryFrom} onChange={(e) => setDeliveryFrom(e.target.value)} placeholder="e.g. Pune" /></Form.Item>
            <Form.Item label="To"><Input value={deliveryTo} onChange={(e) => setDeliveryTo(e.target.value)} placeholder="e.g. Mumbai" /></Form.Item>
          </div>
          <Form.Item label="Transport Cost (₹)">
            <InputNumber min={0} step={0.01} precision={2} style={{ width: "100%" }} prefix="₹"
              value={deliveryCost ? parseFloat(deliveryCost) : undefined}
              onChange={(v) => setDeliveryCost(v != null ? String(v) : "")} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Payment Modal ──────────────────────────────────────────────────── */}
      <Modal title={`Record Payment — ${paymentOrder?.order_number || ""}`}
        open={paymentModalOpen} onCancel={() => setPaymentModalOpen(false)}
        onOk={handlePaymentSubmit} okText="Save Payment" confirmLoading={paymentLoading} width={480}>
        {paymentOrder && (
          <>
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Buyer">{paymentOrder.buyer_business}</Descriptions.Item>
              <Descriptions.Item label="Order Total"><strong>{formatINR(paymentOrder.total_amount)}</strong></Descriptions.Item>
              <Descriptions.Item label="Already Paid">{formatINR(paymentOrder.amount_paid)}</Descriptions.Item>
              <Descriptions.Item label="Remaining"><span className="text-red-500 font-medium">{formatINR(paymentOrder.remaining_amount)}</span></Descriptions.Item>
            </Descriptions>
            <Form form={paymentForm} layout="vertical">
              <Form.Item name="amount_paid" label="Amount Paid (₹)"
                rules={[{ required: true, message: "Enter amount" },
                  { validator: (_, v) => v > 0 && v <= paymentOrder.remaining_amount ? Promise.resolve() : Promise.reject(`Must be between 0 and ${formatINR(paymentOrder.remaining_amount)}`) }]}>
                <InputNumber min={0} max={paymentOrder.remaining_amount} style={{ width: "100%" }} prefix="₹" precision={2} />
              </Form.Item>
              <div style={{ background: computedRemaining > 0 ? "#fff7e6" : "#f6ffed", border: `1px solid ${computedRemaining > 0 ? "#ffd591" : "#b7eb8f"}`, borderRadius: 6, padding: "6px 12px", marginBottom: 16, fontSize: 13 }}>
                Remaining after: <strong style={{ color: computedRemaining > 0 ? "#d46b08" : "#389e0d" }}>{formatINR(computedRemaining)}</strong>
              </div>
              <Form.Item name="payment_method" label="Payment Method" rules={[{ required: true }]}>
                <Radio.Group><Radio.Button value="cash">Cash</Radio.Button><Radio.Button value="online">Online</Radio.Button><Radio.Button value="mix">Mix</Radio.Button></Radio.Group>
              </Form.Item>
              {watchedMethod === "mix" && (
                <Space direction="vertical" style={{ width: "100%" }} size={0}>
                  <Form.Item name="online_amount" label="Online (₹)" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: "100%" }} prefix="₹" precision={2} />
                  </Form.Item>
                  <Form.Item name="offline_amount" label="Cash (₹)" rules={[{ required: true }]}>
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

export default SellerS2SOrders;
