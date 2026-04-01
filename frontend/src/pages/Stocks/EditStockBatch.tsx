import { Modal, Form, InputNumber, Row, Col, Input } from "antd";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import api from "../../services/baseapi";
import { StockEntryDetail } from "../../types/types";

const EditStockEntry = ({
  entry,
  visible,
  onCancel,
  onSaved,
}: {
  entry: StockEntryDetail;
  visible: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (entry && visible) {
      form.setFieldsValue({
        cgst_percentage: entry.cgst_percentage ? parseFloat(entry.cgst_percentage) : null,
        sgst_percentage: entry.sgst_percentage ? parseFloat(entry.sgst_percentage) : null,
        varne_cost: entry.varne_cost ? parseFloat(entry.varne_cost) : null,
        labour_cost: entry.labour_cost ? parseFloat(entry.labour_cost) : null,
        transporter_cost: entry.transporter_cost
          ? parseFloat(entry.transporter_cost)
          : null,
        broker_commission_amount: entry.broker_commission_amount
          ? parseFloat(entry.broker_commission_amount)
          : null,
        manufacture_date: entry.manufacture_date || "",
      });
    }
  }, [entry, visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Only send fields that have a value
      const payload: Record<string, any> = {};
      for (const key of Object.keys(values)) {
        if (values[key] !== null && values[key] !== undefined && values[key] !== "") {
          payload[key] = values[key];
        }
      }

      await api.patch(`stock/${entry.id}/update/`, payload);
      toast.success("Stock entry updated successfully.");
      onSaved();
      onCancel();
    } catch (err) {
      handleError(err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={`Edit Stock Entry #${entry?.id}`}
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Update"
      cancelText="Cancel"
      width={620}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Product: <strong>{entry?.product_name}</strong> — Vendor:{" "}
        <strong>{entry?.vendor_name}</strong> — Qty:{" "}
        <strong>{entry?.quantity}</strong> @ ₹
        <strong>{entry?.purchase_price}</strong>
      </p>

      <Form form={form} layout="vertical" name="edit_stock_entry">
        {/* Tax */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="CGST (%)" name="cgst_percentage" rules={[{ type: "number", min: 0, max: 100 }]}>
              <InputNumber style={{ width: "100%" }} min={0} max={100} step={0.01} precision={2} placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="SGST (%)" name="sgst_percentage" rules={[{ type: "number", min: 0, max: 100 }]}>
              <InputNumber style={{ width: "100%" }} min={0} max={100} step={0.01} precision={2} placeholder="0.00" />
            </Form.Item>
          </Col>
        </Row>

        {/* Other costs */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Varne Cost (₹)" name="varne_cost" rules={[{ type: "number", min: 0 }]}>
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} precision={2} placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Labour Cost (₹)" name="labour_cost" rules={[{ type: "number", min: 0 }]}>
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} precision={2} placeholder="0.00" />
            </Form.Item>
          </Col>
        </Row>

        {/* Transport & Broker */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Transport Cost (₹)" name="transporter_cost" rules={[{ type: "number", min: 0 }]}>
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} precision={2} placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Broker Commission (₹)" name="broker_commission_amount" rules={[{ type: "number", min: 0 }]}>
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} precision={2} placeholder="0.00" />
            </Form.Item>
          </Col>
        </Row>

        {/* Manufacture date */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Manufacture Date" name="manufacture_date">
              <Input type="date" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default EditStockEntry;
