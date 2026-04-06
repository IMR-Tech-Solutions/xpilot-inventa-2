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
import {
  updateproductservice,
  getUnitsForUserService,
} from "../../services/productservices";
import { getmycategoryservice } from "../../services/categoryservices";
import { ProductData, CategoryData } from "../../types/types";
import { UnitData } from "../ProductUnits/ViewUnit";
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
  const [units, setUnits] = useState<UnitData[]>([]);

  const fetchCategories = async () => {
    try {
      const res = await getmycategoryservice();
      setCategories(res);
    } catch (err) {
      handleError(err);
      console.error("Error fetching categories:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await getUnitsForUserService();
      setUnits(res);
    } catch (err) {
      handleError(err);
      console.error("Error fetching units:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUnits();
    if (selectedProduct && visible) {
      form.setFieldsValue({
        product_name: selectedProduct.product_name,
        description: selectedProduct.description,
        unit: selectedProduct.unit,
        low_stock_threshold: selectedProduct.low_stock_threshold,
        is_active: selectedProduct.is_active,
        category: selectedProduct.category,
        sku_code: selectedProduct.sku_code,
        hsn_code: selectedProduct.hsn_code || "",
        selling_price: selectedProduct.selling_price
          ? parseFloat(selectedProduct.selling_price)
          : null,
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
              <Select placeholder="Select unit" allowClear>
                {units.map((unit) => (
                  <Option key={unit.id} value={unit.id}>
                    {unit.unitName}
                  </Option>
                ))}
              </Select>
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

        <Form.Item label="HSN Code" name="hsn_code">
          <Input maxLength={20} placeholder="e.g. 1001, 0902 (optional)" />
        </Form.Item>

        <Form.Item
          label="Selling Price (₹)"
          name="selling_price"
          rules={[{ type: "number", min: 0, message: "Selling price must be 0 or more" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            step={0.01}
            precision={2}
            placeholder="Set default selling price (optional)"
          />
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
              src={`${import.meta.env.VITE_API_IMG_URL}${
                selectedProduct.product_image
              }`}
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
