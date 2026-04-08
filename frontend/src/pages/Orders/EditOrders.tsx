import { Modal, Form, Select, InputNumber } from "antd";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import {
  updateposorderservice,
  cancelposorderservice,
} from "../../services/posorderservices";
import {
  viewPOSPaymentReceiptService,
  downloadPOSPaymentReceiptService,
} from "../../services/paymentreceiptservices";
import { OrderItem } from "../../types/types";
import { Button } from "antd";
import { FileTextOutlined, DownloadOutlined } from "@ant-design/icons";

const { Option } = Select;

const ORDER_STATUS_CHOICES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Ready for Pickup" },
  { value: "completed", label: "Completed" },
];

const PAYMENT_STATUS_CHOICES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "failed", label: "Failed" },
];

const PAYMENT_METHOD_CHOICES = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit", label: "Credit" },
  { value: "mix", label: "Mix (Online + Offline)" },
];

const EditOrders = ({
  selectedOrder,
  visible,
  onCancel,
  fetchOrders,
}: {
  selectedOrder: OrderItem;
  visible: boolean;
  onCancel: () => void;
  fetchOrders: () => void;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const totalAmount = parseFloat(selectedOrder.total_amount || "0");

  useEffect(() => {
    if (selectedOrder && visible) {
      form.setFieldsValue({
        order_status: selectedOrder.order_status,
        payment_status: selectedOrder.payment_status,
        payment_method: selectedOrder.payment_method,
        amount_paid: parseFloat(selectedOrder.amount_paid || "0"),
        online_amount: 0,
        offline_amount: 0,
      });
      setTransactionId(null);
    }
  }, [selectedOrder, visible, form]);

  const paymentStatus = Form.useWatch("payment_status", form);
  const paymentMethod = Form.useWatch("payment_method", form);
  const amountPaid = Form.useWatch("amount_paid", form) || 0;
  const onlineAmount = Form.useWatch("online_amount", form) || 0;
  const offlineAmount = Form.useWatch("offline_amount", form) || 0;

  const remainingAmount = Math.max(0, totalAmount - amountPaid);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (values.payment_method === "mix") {
        const mixTotal = (values.online_amount || 0) + (values.offline_amount || 0);
        if (Math.abs(mixTotal - (values.amount_paid || 0)) > 0.01) {
          toast.error("Online + Offline amounts must equal amount paid");
          return;
        }
      }

      const payload: Record<string, any> = {
        order_status: values.order_status,
        payment_status: values.payment_status,
        payment_method: values.payment_method,
        amount_paid: values.payment_status === "paid" ? totalAmount.toFixed(2) : (values.amount_paid || 0).toFixed(2),
      };

      if (values.payment_method === "mix") {
        payload.online_amount = (values.online_amount || 0).toFixed(2);
        payload.offline_amount = (values.offline_amount || 0).toFixed(2);
      }

      const result = await updateposorderservice(selectedOrder.id!, payload as any);
      toast.success("Order updated successfully");
      fetchOrders();
      if (result?.transaction_id) {
        setTransactionId(result.transaction_id);
      } else {
        onCancel();
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setLoading(true);
      await cancelposorderservice(selectedOrder.id!);
      toast.success("Order cancelled successfully");
      fetchOrders();
      onCancel();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async () => {
    if (!transactionId || !selectedOrder.id) return;
    setReceiptLoading(true);
    try {
      await viewPOSPaymentReceiptService(selectedOrder.id, transactionId);
    } catch (err) {
      handleError(err);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!transactionId || !selectedOrder.id) return;
    setReceiptLoading(true);
    try {
      await downloadPOSPaymentReceiptService(selectedOrder.id, transactionId);
    } catch (err) {
      handleError(err);
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <Modal
      title={`Edit Order — ${selectedOrder?.order_number || ""}`}
      open={visible}
      onCancel={() => { setTransactionId(null); onCancel(); }}
      footer={
        transactionId ? [
          <Button key="back" onClick={() => { setTransactionId(null); onCancel(); }}>Close</Button>,
          <Button
            key="viewReceipt"
            icon={<FileTextOutlined />}
            loading={receiptLoading}
            onClick={handleViewReceipt}
          >
            View Receipt
          </Button>,
          <Button
            key="downloadReceipt"
            type="primary"
            icon={<DownloadOutlined />}
            loading={receiptLoading}
            onClick={handleDownloadReceipt}
          >
            Download Receipt
          </Button>,
        ] : [
          <Button key="cancelOrder" danger onClick={handleCancelOrder} loading={loading}>
            Cancel Order
          </Button>,
          <Button key="back" onClick={onCancel}>Close</Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleOk}>Save</Button>,
        ]
      }
    >
      {/* Receipt ready banner */}
      {transactionId && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-700">
          <strong>Payment saved!</strong> A receipt has been generated for this payment. Use the buttons below to view or download it.
        </div>
      )}

      {/* Order summary */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-white/[0.03] rounded-lg text-sm space-y-1">
        <div className="flex justify-between">
          <span className="theme-text">Total Amount:</span>
          <span className="font-semibold theme-text-2">₹{totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="theme-text">Amount Paid:</span>
          <span className="font-semibold text-green-600">₹{parseFloat(selectedOrder.amount_paid || "0").toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="theme-text">Remaining:</span>
          <span className="font-semibold text-red-500">₹{parseFloat(selectedOrder.remaining_amount || "0").toFixed(2)}</span>
        </div>
      </div>

      <Form form={form} layout="vertical" name="edit_order">
        <Form.Item label="Order Status" name="order_status"
          rules={[{ required: true, message: "Please select an order status" }]}>
          <Select placeholder="Select order status">
            {ORDER_STATUS_CHOICES.map((s) => (
              <Option key={s.value} value={s.value}>{s.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Payment Status" name="payment_status"
          rules={[{ required: true, message: "Please select a payment status" }]}>
          <Select placeholder="Select payment status"
            onChange={(val) => {
              if (val === "paid") form.setFieldValue("amount_paid", totalAmount);
            }}>
            {PAYMENT_STATUS_CHOICES.map((s) => (
              <Option key={s.value} value={s.value}>{s.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Payment Method" name="payment_method">
          <Select placeholder="Select payment method">
            {PAYMENT_METHOD_CHOICES.map((m) => (
              <Option key={m.value} value={m.value}>{m.label}</Option>
            ))}
          </Select>
        </Form.Item>

        {/* Amount paid — shown for partial or any non-paid status */}
        {paymentStatus !== "paid" && (
          <Form.Item label={`Amount Paid (₹) — Total: ₹${totalAmount.toFixed(2)}`} name="amount_paid">
            <InputNumber style={{ width: "100%" }} min={0} max={totalAmount}
              step={0.01} precision={2} placeholder="0.00" />
          </Form.Item>
        )}

        {/* Remaining preview */}
        {paymentStatus === "partial" && (
          <div className="mb-4 flex justify-between text-sm">
            <span className="theme-text">Remaining after update:</span>
            <span className="font-semibold text-red-500">₹{remainingAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Mix payment breakdown */}
        {paymentMethod === "mix" && (
          <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg mb-4">
            <p className="text-xs theme-text font-medium">Mix Payment Breakdown</p>
            <Form.Item label="Online Amount (₹)" name="online_amount" className="!mb-2">
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} precision={2} placeholder="0.00" />
            </Form.Item>
            <Form.Item label="Offline Amount (₹)" name="offline_amount" className="!mb-2">
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} precision={2} placeholder="0.00" />
            </Form.Item>
            <div className={`text-xs flex justify-between ${Math.abs((onlineAmount + offlineAmount) - amountPaid) < 0.01 ? "text-green-500" : "text-red-500"}`}>
              <span>Online + Offline:</span>
              <span>₹{(onlineAmount + offlineAmount).toFixed(2)} / ₹{amountPaid.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default EditOrders;
