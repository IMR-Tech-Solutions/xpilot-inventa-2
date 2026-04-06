import {
  Modal,
  Form,
  Input,
  Upload,
  UploadProps,
  Select,
  Row,
  Col,
} from "antd";
import { useEffect, useState } from "react";
import { UploadOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import { getChangedFormData } from "../../utils/changedData";
import { updatecustomerservice } from "../../services/customerservices";
import { CustomerData } from "../../types/types";

const { Option } = Select;

const Editcustomer = ({
  selectedCustomer,
  visible,
  onCancel,
  fetchCustomers,
}: {
  selectedCustomer: CustomerData;
  visible: boolean;
  onCancel: () => void;
  fetchCustomers: () => void;
}) => {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (selectedCustomer && visible) {
      form.setFieldsValue({
        first_name: selectedCustomer.first_name,
        last_name: selectedCustomer.last_name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address,
        village: selectedCustomer.village,
        city: selectedCustomer.city,
        state: selectedCustomer.state,
        zip_code: selectedCustomer.zip_code,
        country: selectedCustomer.country,
        date_of_birth: selectedCustomer.date_of_birth,
        gender: selectedCustomer.gender,
        num_of_animals: selectedCustomer.num_of_animals,
        type_of_customer: selectedCustomer.type_of_customer,
        milk_collection: selectedCustomer.milk_collection ?? "",
        competitor_name: selectedCustomer.competitor_name ?? "",
        competitor_mobile_number: selectedCustomer.competitor_mobile_number ?? "",
        competitor_address: selectedCustomer.competitor_address ?? "",
      });
    }
  }, [selectedCustomer, visible, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const customerID = selectedCustomer.id;
    try {
      const formData = getChangedFormData(
        selectedCustomer,
        values,
        file,
        "customer_image"
      );
      await updatecustomerservice(customerID, formData);
      toast.success("Customer updated successfully");
      fetchCustomers();
      onCancel();
    } catch (err) {
      console.error("Error updating customer:", err);
      handleError(err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFile(null);
    onCancel();
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      setFile(file);
      return false;
    },
    fileList: file ? [file as any] : [],
  };

  return (
    <Modal
      title="Edit Customer"
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Save"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical" name="edit_customer">
        <Row gutter={10}>
          <Col span={12}>
            <Form.Item
              label="First Name"
              name="first_name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Last Name"
              name="last_name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Email" name="email" rules={[{ type: "email" }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Phone" name="phone">
          <Input />
        </Form.Item>

        <Form.Item label="Address" name="address">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Row gutter={10}>
          <Col span={12}>
            <Form.Item label="Village" name="village">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="City" name="city">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={10}>
          <Col span={12}>
            <Form.Item label="State" name="state">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Zip Code" name="zip_code">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Country" name="country">
          <Input />
        </Form.Item>

        <Col span={12}>
          <Form.Item
            label="Date of Birth"
            name="date_of_birth"
            rules={[{ required: false }]}
          >
            <Input
              type="date"
              style={{ width: "100%" }}
              placeholder="Select Date of birth"
            />
          </Form.Item>
        </Col>

        <Form.Item label="Gender" name="gender">
          <Select placeholder="Select gender">
            <Option value="Male">Male</Option>
            <Option value="Female">Female</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Number of Animals" name="num_of_animals">
          <Input type="number" />
        </Form.Item>

        <Form.Item label="Type of Customer" name="type_of_customer">
          <Select placeholder="Select Customer Type" allowClear>
            <Option value="dairy">Dairy</Option>
            <Option value="distributor_dealer">Distributor/Dealer</Option>
            <Option value="farmer">Farmer</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Milk Collection (Liters)" name="milk_collection">
          <Input type="number" min={0} step={0.1} placeholder="e.g. 25.5" />
        </Form.Item>

        <Form.Item label="Competitor Name" name="competitor_name">
          <Input placeholder="Enter competitor name" />
        </Form.Item>

        <Form.Item label="Competitor Mobile" name="competitor_mobile_number">
          <Input placeholder="Enter competitor mobile number" />
        </Form.Item>

        <Form.Item label="Competitor Address" name="competitor_address">
          <Input.TextArea rows={2} placeholder="Enter competitor address" />
        </Form.Item>

        <Form.Item label="Customer Image" name="customer_image">
          <Upload {...uploadProps} maxCount={1} accept="image/*">
            <button type="button" id="form-btn">
              <UploadOutlined /> <span>Click to upload</span>
            </button>
          </Upload>
        </Form.Item>

        {selectedCustomer?.customer_image && (
          <Form.Item label="Current Image">
            <img
              src={`${import.meta.env.VITE_API_IMG_URL}${
                selectedCustomer.customer_image
              }`}
              alt="Customer"
              style={{
                maxWidth: "100px",
                maxHeight: "100px",
                objectFit: "cover",
              }}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default Editcustomer;
