import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Table, Tag, Descriptions, Spin, Button } from "antd";
import { ArrowLeftOutlined, FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { getPOSOrderStatementService } from "../../services/orderstatementservice";
import {
  viewPOSPaymentReceiptService,
  downloadPOSPaymentReceiptService,
} from "../../services/paymentreceiptservices";
import { handleError } from "../../utils/handleError";
import dayjs from "dayjs";

const formatINR = (v: number) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  paid: "green",
  partial: "orange",
  pending: "red",
  failed: "red",
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: "orange",
  confirmed: "blue",
  processing: "purple",
  ready: "cyan",
  completed: "green",
  cancelled: "red",
};

interface OrderData {
  id: number;
  order_number: string;
  created_at: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  city: string;
  zipcode: string;
  subtotal: number;
  cgst_percentage: number;
  cgst_amount: number;
  sgst_percentage: number;
  sgst_amount: number;
  discount_amount: number;
  labour_charges: number;
  transport_charges: number;
  total_amount: number;
  amount_paid: number;
  remaining_amount: number;
}

interface Item {
  id: number;
  product_name: string;
  sku: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Transaction {
  id: number;
  date: string;
  amount: number;
  payment_method: string;
  online_amount: number;
  offline_amount: number;
  previous_paid: number;
  total_paid_after: number;
  remaining_after: number;
  recorded_by: string;
}

const POSOrderStatement = () => {
  const { orderID } = useParams<{ orderID: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receiptLoading, setReceiptLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getPOSOrderStatementService(Number(orderID));
        setOrder(data.order);
        setItems(data.items);
        setTransactions(data.transactions);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };
    if (orderID) fetch();
  }, [orderID]);

  const handleViewReceipt = async (txnId: number) => {
    setReceiptLoading(txnId);
    try {
      await viewPOSPaymentReceiptService(Number(orderID), txnId);
    } catch (err) {
      handleError(err);
    } finally {
      setReceiptLoading(null);
    }
  };

  const handleDownloadReceipt = async (txnId: number) => {
    setReceiptLoading(txnId);
    try {
      await downloadPOSPaymentReceiptService(Number(orderID), txnId);
    } catch (err) {
      handleError(err);
    } finally {
      setReceiptLoading(null);
    }
  };

  const itemColumns = [
    { title: "#", key: "idx", width: 50, render: (_: any, __: Item, i: number) => i + 1 },
    { title: "Product", dataIndex: "product_name", key: "product_name" },
    { title: "SKU", dataIndex: "sku", key: "sku" },
    { title: "Unit", dataIndex: "unit", key: "unit", width: 80 },
    { title: "Qty", dataIndex: "quantity", key: "quantity", width: 70, align: "center" as const },
    {
      title: "Unit Price",
      dataIndex: "unit_price",
      key: "unit_price",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Total",
      dataIndex: "total_price",
      key: "total_price",
      align: "right" as const,
      render: (v: number) => <strong>{formatINR(v)}</strong>,
    },
  ];

  const txnColumns = [
    {
      title: "#",
      key: "idx",
      width: 50,
      render: (_: any, __: Transaction, i: number) => i + 1,
    },
    {
      title: "Date & Time",
      dataIndex: "date",
      key: "date",
      render: (d: string) => dayjs(d).format("DD MMM YYYY, hh:mm A"),
    },
    {
      title: "Amount Paid",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (v: number) => (
        <span className="text-green-600 font-semibold">{formatINR(v)}</span>
      ),
    },
    {
      title: "Method",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (m: string) => <Tag>{m?.toUpperCase()}</Tag>,
    },
    {
      title: "Previously Paid",
      dataIndex: "previous_paid",
      key: "previous_paid",
      align: "right" as const,
      render: (v: number) => formatINR(v),
    },
    {
      title: "Total Paid After",
      dataIndex: "total_paid_after",
      key: "total_paid_after",
      align: "right" as const,
      render: (v: number) => <strong>{formatINR(v)}</strong>,
    },
    {
      title: "Remaining After",
      dataIndex: "remaining_after",
      key: "remaining_after",
      align: "right" as const,
      render: (v: number) =>
        v === 0 ? (
          <Tag color="green">PAID IN FULL</Tag>
        ) : (
          <span className="text-red-500 font-semibold">{formatINR(v)}</span>
        ),
    },
    {
      title: "Recorded By",
      dataIndex: "recorded_by",
      key: "recorded_by",
    },
    {
      title: "Receipt",
      key: "receipt",
      render: (_: any, record: Transaction) => (
        <div className="flex gap-1">
          <Button
            size="small"
            icon={<FileTextOutlined />}
            loading={receiptLoading === record.id}
            onClick={() => handleViewReceipt(record.id)}
            title="View Receipt"
          />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            loading={receiptLoading === record.id}
            onClick={() => handleDownloadReceipt(record.id)}
            title="Download Receipt"
          />
        </div>
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
      <PageMeta title={`Statement — ${order.order_number}`} description="Order payment statement" />
      <PageBreadcrumb pageTitle={`Order Statement — ${order.order_number}`} />

      <div className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {/* ── Order Details ── */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 mb-6">
        <h2 className="text-base font-semibold theme-text mb-4">Order Details</h2>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Order No">{order.order_number}</Descriptions.Item>
          <Descriptions.Item label="Date">
            {dayjs(order.created_at).format("DD MMM YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Order Status">
            <Tag color={ORDER_STATUS_COLOR[order.order_status] || "default"}>
              {order.order_status?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Customer">{order.customer_name}</Descriptions.Item>
          <Descriptions.Item label="Phone">{order.customer_phone}</Descriptions.Item>
          <Descriptions.Item label="Email">{order.customer_email}</Descriptions.Item>
          {order.address && (
            <Descriptions.Item label="Address" span={3}>
              {[order.address, order.city, order.zipcode].filter(Boolean).join(", ")}
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Financials */}
        <div className="mt-4 flex justify-end">
          <div className="min-w-[280px] text-sm space-y-1">
            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/10">
              <span className="theme-text">Subtotal</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            {order.cgst_amount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/10">
                <span className="theme-text">CGST ({order.cgst_percentage}%)</span>
                <span>{formatINR(order.cgst_amount)}</span>
              </div>
            )}
            {order.sgst_amount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/10">
                <span className="theme-text">SGST ({order.sgst_percentage}%)</span>
                <span>{formatINR(order.sgst_amount)}</span>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/10">
                <span className="theme-text">Discount</span>
                <span className="text-red-500">-{formatINR(order.discount_amount)}</span>
              </div>
            )}
            {order.transport_charges > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/10">
                <span className="theme-text">Transport</span>
                <span>{formatINR(order.transport_charges)}</span>
              </div>
            )}
            {order.labour_charges > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-white/10">
                <span className="theme-text">Labour</span>
                <span>{formatINR(order.labour_charges)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-gray-800 dark:border-white/30 font-bold text-base">
              <span>Total</span>
              <span>{formatINR(order.total_amount)}</span>
            </div>
            <div className="flex justify-between py-1 text-green-600 font-semibold">
              <span>Amount Paid</span>
              <span>{formatINR(order.amount_paid)}</span>
            </div>
            <div className="flex justify-between py-1 text-red-500 font-semibold">
              <span>Remaining</span>
              <span>
                {order.remaining_amount === 0 ? (
                  <Tag color="green">FULLY PAID</Tag>
                ) : (
                  formatINR(order.remaining_amount)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Items ── */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 mb-6">
        <h2 className="text-base font-semibold theme-text mb-4">Order Items</h2>
        <Table
          columns={itemColumns}
          dataSource={items}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      </div>

      {/* ── Payment Transactions ── */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold theme-text">
            Payment History
            <Tag color={PAYMENT_STATUS_COLOR[order.payment_status] || "default"} className="ml-2">
              {order.payment_status?.toUpperCase()}
            </Tag>
          </h2>
          <span className="text-sm theme-text">
            {transactions.length} payment{transactions.length !== 1 ? "s" : ""} recorded
          </span>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No payments recorded yet.</div>
        ) : (
          <Table
            columns={txnColumns}
            dataSource={transactions}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 900 }}
            rowClassName={(_, index) =>
              index % 2 === 0 ? "" : "bg-gray-50 dark:bg-white/[0.02]"
            }
          />
        )}
      </div>
    </div>
  );
};

export default POSOrderStatement;
