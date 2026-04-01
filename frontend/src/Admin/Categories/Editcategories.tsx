import { Modal, Form, Input, Upload, UploadProps } from "antd";
import { CategoryData } from "../../types/types";
import { useEffect, useState } from "react";
import { updatecategoryservice } from "../../services/categoryservices";
import { toast } from "react-toastify";
import { UploadOutlined } from "@ant-design/icons";
import { handleError } from "../../utils/handleError";

const Editcategory = ({
  categoryData,
  visible,
  onCancel,
  fetchCategories,
}: {
  categoryData: CategoryData;
  visible: boolean;
  onCancel: () => void;
  fetchCategories: () => void;
}) => {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (categoryData && visible) {
      form.setFieldsValue({
        category_name: categoryData.category_name,
      });
    }
  }, [categoryData, visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const categoryID = categoryData.id;
      const formData = new FormData();
      formData.append("category_name", values.category_name);
      if (file) {
        formData.append("category_image", file);
      }
      await updatecategoryservice(categoryID, formData);
      toast.success("Category Updated Successfully");
      fetchCategories();
      onCancel();
    } catch (err) {
      console.error("Error updating category:", err);
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
      title="Edit Category"
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Save"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical" name="edit_category">
        <Form.Item
          label="Category Name"
          name="category_name"
          rules={[
            { required: true, message: "Please input the category name!" },
            { min: 2, message: "Category name must be at least 2 characters!" },
          ]}
        >
          <Input placeholder="Enter category name" />
        </Form.Item>

        <Form.Item label="Category Image" name="category_image">
          <Upload {...uploadProps} maxCount={1} accept="image/*">
            <button type="button" id="form-btn">
              <UploadOutlined /> <span>Click to upload</span>
            </button>
          </Upload>
        </Form.Item>
        {categoryData?.category_image && (
          <Form.Item label="Current Image">
            <img
              src={`${import.meta.env.VITE_API_IMG_URL}${
                categoryData.category_image
              }`}
              alt="Category"
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

export default Editcategory;
