import { Modal, Form, Input, Switch, Row, Col } from "antd";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import { getChangedFormData } from "../../utils/changedData";
import { updateTransporterService } from "../../services/transporterservices";
import { TransporterData } from "../../types/types";

const EditTransporter = ({
  transporterData,
  visible,
  onCancel,
  fetchTransporters,
}: {
  transporterData: TransporterData;
  visible: boolean;
  onCancel: () => void;
  fetchTransporters: () => void;
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (transporterData && visible) {
      form.setFieldsValue({
        transporter_name: transporterData.transporter_name,
        contact_person: transporterData.contact_person,
        contact_number: transporterData.contact_number,
        email: transporterData.email,
        gst_number: transporterData.gst_number,
        pan_number: transporterData.pan_number,
        vehicle_number: transporterData.vehicle_number,
        address: transporterData.address,
        city: transporterData.city,
        state: transporterData.state,
        postal_code: transporterData.postal_code,
        bank_name: transporterData.bank_name,
        account_number: transporterData.account_number,
        ifsc_code: transporterData.ifsc_code,
        upi_id: transporterData.upi_id,
        is_active: transporterData.is_active,
      });
    }
  }, [transporterData, visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const transporterID = transporterData.id;

      const formData = getChangedFormData(transporterData, values, null, "");

      await updateTransporterService(transporterID, formData);
      toast.success("Transporter updated successfully");
      fetchTransporters();
      onCancel();
    } catch (err) {
      console.error("Error updating transporter:", err);
      handleError(err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Edit Transporter"
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Save"
      cancelText="Cancel"
      width={800}
    >
      <Form form={form} layout="vertical" name="edit_transporter">
        {/* Basic Information */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Transporter Name" name="transporter_name" rules={[{ required: true, message: 'Transporter name is required' }]}>
              <Input placeholder="Enter transporter name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Contact Person" name="contact_person">
              <Input placeholder="Enter contact person name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Contact Number" name="contact_number" rules={[{ required: true, message: 'Contact number is required' }]}>
              <Input placeholder="Enter contact number" maxLength={15} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Please enter valid email" }]}>
              <Input placeholder="Enter email address" />
            </Form.Item>
          </Col>
        </Row>

        {/* Tax & Vehicle Information */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="GST Number" name="gst_number">
              <Input placeholder="Enter GST number" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="PAN Number" name="pan_number">
              <Input placeholder="Enter PAN number" maxLength={10} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Vehicle Number" name="vehicle_number">
              <Input placeholder="Enter vehicle number" />
            </Form.Item>
          </Col>
        </Row>

        {/* Address Information */}
        <Form.Item label="Address" name="address">
          <Input.TextArea rows={2} placeholder="Enter address" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="City" name="city">
              <Input placeholder="Enter city" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="State" name="state">
              <Input placeholder="Enter state" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Postal Code" name="postal_code">
              <Input placeholder="Enter postal code" maxLength={10} />
            </Form.Item>
          </Col>
        </Row>

        {/* Bank Information */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Bank Name" name="bank_name">
              <Input placeholder="Enter bank name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Account Number" name="account_number">
              <Input placeholder="Enter account number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="IFSC Code" name="ifsc_code">
              <Input placeholder="Enter IFSC code" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="UPI ID" name="upi_id">
              <Input placeholder="Enter UPI ID" />
            </Form.Item>
          </Col>
        </Row>

        {/* Status */}
        <Form.Item label="Active" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditTransporter;
