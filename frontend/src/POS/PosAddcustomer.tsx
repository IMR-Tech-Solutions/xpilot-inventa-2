import { Modal, Form, Input } from "antd";
import { useState } from "react";
import { addcustomerservice } from "../services/customerservices";
import { toast } from "react-toastify";
import { handleError } from "../utils/handleError";
import { Select } from "antd";

const PosAddcustomer = ({
  visible,
  onCancel,
  fetchCustomers,
}: {
  visible: boolean;
  onCancel: () => void;
  fetchCustomers?: () => void;
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();

      const requiredFields = ["first_name", "last_name", "phone"];
      for (const field of requiredFields) {
        if (!values[field] || values[field].toString().trim() === "") {
          const formattedKey = field
            .replace("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
          setLoading(false);
          toast.error(`Please fill ${formattedKey}`);
          return;
        }
      }

      const formData = new FormData();
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("phone", values.phone);
      if (values.village) formData.append("village", values.village);
      if (values.type_of_customer)
        formData.append("type_of_customer", values.type_of_customer);

      await addcustomerservice(formData);
      toast.success("Customer added successfully");
      form.resetFields();
      onCancel();
      fetchCustomers?.();
    } catch (err) {
      console.error("Error adding customer:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };
  const { Option } = Select;

  return (
    <Modal
      title="Add Customer"
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Save"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical" name="add_customer">
        <Form.Item label="First Name" name="first_name">
          <Input placeholder="Enter first name" />
        </Form.Item>

        <Form.Item label="Last Name" name="last_name">
          <Input placeholder="Enter last name" />
        </Form.Item>

        <Form.Item
          label="Phone"
          name="phone"
          rules={[{ min: 7, message: "Phone number too short!" }]}
        >
          <Input placeholder="Enter phone number" />
        </Form.Item>

        <Form.Item label="Village" name="village">
          <Input placeholder="Enter village" />
        </Form.Item>

        <Form.Item label="Customer Type" name="type_of_customer">
          <Select placeholder="Select Cusxtomer Type" allowClear>
            <Option value="dairy">Dairy</Option>
            <Option value="distributor_dealer">Distributor/Dealer</Option>
            <Option value="farmer">Farmer</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PosAddcustomer;
