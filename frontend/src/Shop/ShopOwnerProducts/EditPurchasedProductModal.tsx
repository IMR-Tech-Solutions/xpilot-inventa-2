import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Switch } from "antd";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import {
  updatepurchaseproductpriceservice,
  makeshopownerproductactive,
} from "../../services/shopservices";
import { ShopPurchasedProduct } from "../../types/types";

interface EditPurchasedProductModalProps {
  visible: boolean;
  onCancel: () => void;
  product: ShopPurchasedProduct | null;
  onSuccess: () => void;
}

const EditPurchasedProductModal: React.FC<EditPurchasedProductModalProps> = ({
  visible,
  onCancel,
  product,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (product && visible) {
      form.setFieldsValue({
        selling_price: product.selling_price,
      });
      setIsActive(product.is_active);
    }
  }, [product, visible, form]);

  const handleOk = async (values: { selling_price: number }) => {
    if (!product) return;
    setLoading(true);
    try {
      await updatepurchaseproductpriceservice(product.id, values.selling_price);
      toast.success("Selling price updated successfully!");
      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error updating price:", error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!product) return;
    setToggleLoading(true);
    try {
      await makeshopownerproductactive(product.id);
      setIsActive(!isActive);
      toast.success(
        `Product ${!isActive ? "activated" : "deactivated"} successfully!`
      );
      onSuccess();
    } catch (error) {
      console.error("Error toggling product status:", error);
      handleError(error);
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <Modal
      title={`Edit Selling Price - ${product?.product_name || "Product"}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleOk}>
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm theme-text mb-1">
            <strong>Product:</strong> {product?.product_name}
          </p>
          <p className="text-sm theme-text mb-1">
            <strong>SKU:</strong> {product?.product_sku}
          </p>
          <p className="text-sm theme-text mb-1">
            <strong>Quantity:</strong> {product?.quantity} units
          </p>
          <p className="text-sm theme-text">
            <strong>Purchase Price:</strong> ₹{product?.purchase_price}
          </p>
        </div>

        <div className="mb-4 p-3 border rounded-lg flex items-center justify-between">
          <span className="text-sm theme-text">
            <strong>Status:</strong> {isActive ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={isActive}
            loading={toggleLoading}
            onChange={handleToggleActive}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
          />
        </div>

        <Form.Item label="Selling Price" name="selling_price">
          <Input
            type="number"
            min={parseFloat(product?.purchase_price || "0")}
            step={0.01}
            placeholder="Enter selling price"
          />
        </Form.Item>
        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            {loading ? "Updating..." : "Update Selling Price"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditPurchasedProductModal;
