import { Modal, Form, Input, Switch, Row, Col } from "antd";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import { getChangedFormData } from "../../utils/changedData";
import { updatevendorservice } from "../../services/vendorservices";
import { VendorData } from "../../types/types";

const Editvendor = ({
  selectedVendor,
  visible,
  onCancel,
  fetchVendors,
}: {
  selectedVendor: VendorData;
  visible: boolean;
  onCancel: () => void;
  fetchVendors: () => void;
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedVendor && visible) {
      form.setFieldsValue({
        vendor_name: selectedVendor.vendor_name,
        contact_person: selectedVendor.contact_person,
        contact_number: selectedVendor.contact_number,
        email: selectedVendor.email,
        gst_number: selectedVendor.gst_number,
        pan_number: selectedVendor.pan_number,
        registration_number: selectedVendor.registration_number,
        address: selectedVendor.address,
        state: selectedVendor.state,
        city: selectedVendor.city,
        postal_code: selectedVendor.postal_code,
        bank_name: selectedVendor.bank_name,
        account_number: selectedVendor.account_number,
        ifsc_code: selectedVendor.ifsc_code,
        upi_id: selectedVendor.upi_id,
        is_active: selectedVendor.is_active,
      });
    }
  }, [selectedVendor, visible, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const vendorID = selectedVendor.id;
    try {
      const formData = getChangedFormData(selectedVendor, values);
      await updatevendorservice(vendorID, formData);
      toast.success("Vendor updated successfully");
      fetchVendors();
      onCancel();
    } catch (err) {
      console.error("Error updating vendor:", err);
      handleError(err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Edit Vendor"
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Save"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical" name="edit_vendor">
        <Form.Item
          label="Vendor Name"
          name="vendor_name"
          rules={[{ required: true, message: 'Vendor name is required' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Contact Person" name="contact_person">
          <Input />
        </Form.Item>

        <Row gutter={10}>
          <Col span={12}>
            <Form.Item label="Contact Number" name="contact_number" rules={[{ required: true, message: 'Contact number is required' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Email" name="email">
              <Input type="email" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={10}>
          <Col span={12}>
            <Form.Item label="GST Number" name="gst_number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="PAN Number" name="pan_number">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Registration Number" name="registration_number">
          <Input />
        </Form.Item>

        <Form.Item label="Address" name="address">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Row gutter={10}>
          <Col span={8}>
            <Form.Item label="State" name="state">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="City" name="city">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Postal Code" name="postal_code">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Bank Name" name="bank_name">
          <Input />
        </Form.Item>

        <Row gutter={10}>
          <Col span={12}>
            <Form.Item label="Account Number" name="account_number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="IFSC Code" name="ifsc_code">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="UPI ID" name="upi_id">
          <Input />
        </Form.Item>

        <Form.Item label="Active" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Editvendor;
