import { Modal, Form, Input, Switch, Row, Col } from "antd";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import { getChangedFormData } from "../../utils/changedData";
import { updatebrokerservice } from "../../services/brokerservices";
import { BrokerDataType } from "../../types/types";

const Editbroker = ({
  selectedBroker,
  visible,
  onCancel,
  fetchBrokers,
}: {
  selectedBroker: BrokerDataType;
  visible: boolean;
  onCancel: () => void;
  fetchBrokers: () => void;
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedBroker && visible) {
      form.setFieldsValue({
        broker_name: selectedBroker.broker_name,
        contact_person: selectedBroker.contact_person,
        phone_number: selectedBroker.phone_number,
        email: selectedBroker.email,
        address: selectedBroker.address,
        city: selectedBroker.city,
        state: selectedBroker.state,
        postal_code: selectedBroker.postal_code,
        pan_number: selectedBroker.pan_number,
        gst_number: selectedBroker.gst_number,
        license_number: selectedBroker.license_number,
        default_commission_amount: Number(
          selectedBroker.default_commission_amount,
        ),
        is_active: selectedBroker.is_active,
      });
    }
  }, [selectedBroker, visible, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const brokerID = selectedBroker.id;
    try {
      const formData = getChangedFormData(selectedBroker, values, null);
      await updatebrokerservice(brokerID, formData);
      toast.success("Broker updated successfully");
      fetchBrokers();
      onCancel();
    } catch (err) {
      console.error("Error updating broker:", err);
      handleError(err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Edit Broker"
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Save"
      cancelText="Cancel"
      width={700}
    >
      <Form form={form} layout="vertical" name="edit_broker">
        <Row gutter={10}>
          <Col span={12}>
            <Form.Item
              label="Broker Name"
              name="broker_name"
              rules={[{ required: true, message: "Broker name is required" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Contact Person" name="contact_person">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={10}>
          <Col span={12}>
            <Form.Item
              label="Phone Number"
              name="phone_number"
              rules={[
                { required: true, message: "Phone number is required" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Email" name="email" rules={[{ type: "email" }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Address" name="address">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Row gutter={10}>
          <Col span={8}>
            <Form.Item label="City" name="city">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="State" name="state">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Postal Code" name="postal_code">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={10}>
          <Col span={12}>
            <Form.Item label="PAN Number" name="pan_number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="GST Number" name="gst_number">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* <Row gutter={10}>
          <Col span={12}>
            <Form.Item label="License Number" name="license_number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Default Commission (₹)"
              name="default_commission_amount"
              rules={[{ type: "number", min: 0 }]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row> */}

        <Form.Item label="Active" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Editbroker;
