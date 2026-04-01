import {
  Modal,
  Form,
  Input,
  Upload,
  UploadProps,
  Select,
  InputNumber,
  Switch,
  Row,
  Col,
} from "antd";
import { useEffect, useState } from "react";
import { UploadOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import { getChangedFormData } from "../../utils/changedData";
import { updateproductservice } from "../../services/productservices";
import { getmycategoryservice } from "../../services/categoryservices";
import { ProductData, CategoryData } from "../../types/types";

const { Option } = Select;

const Editproduct = ({
  selectedProduct,
  visible,
  onCancel,
  fetchProducts,
}: {
  selectedProduct: ProductData;
  visible: boolean;
  onCancel: () => void;
  fetchProducts: () => void;
}) => {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  const fetchCategories = async () => {
    try {
      const res = await getmycategoryservice();
      setCategories(res);
    } catch (err) {
      handleError(err);
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (selectedProduct && visible) {
      form.setFieldsValue({
        product_name: selectedProduct.product_name,
        description: selectedProduct.description,
        unit: selectedProduct.unit,
        low_stock_threshold: selectedProduct.low_stock_threshold,
        is_active: selectedProduct.is_active,
        category: selectedProduct.category,
        sku_code: selectedProduct.sku_code,
      });
    }
  }, [selectedProduct, visible, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const productID = selectedProduct.id;
    try {
      const formData = getChangedFormData(
        selectedProduct,
        values,
        file,
        "product_image"
      );
      await updateproductservice(productID, formData);
      toast.success("Product updated successfully");
      fetchProducts();
      onCancel();
    } catch (err) {
      console.error("Error updating product:", err);
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
      title="Edit Product"
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Save"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical" name="edit_product">
        <Form.Item
          label="Product Name"
          name="product_name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Row gutter={10}>
          <Col span={12}>
            <Form.Item label="Unit" name="unit" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Low Stock Threshold"
              name="low_stock_threshold"
              rules={[{ required: true, type: "number", min: 0 }]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        {selectedProduct.category_name.toLowerCase() === "xpilot" ? (
          ""
        ) : (
          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select category">
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item label="SKU Code" name="sku_code">
          <Input />
        </Form.Item>

        <Form.Item label="Active" name="is_active" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Product Image" name="product_image">
          <Upload {...uploadProps} maxCount={1} accept="image/*">
            <button type="button" id="form-btn">
              <UploadOutlined /> <span>Click to upload</span>
            </button>
          </Upload>
        </Form.Item>

        {selectedProduct?.product_image && (
          <Form.Item label="Current Image">
            <img
              src={selectedProduct.product_image}
              alt="Product"
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

export default Editproduct;
