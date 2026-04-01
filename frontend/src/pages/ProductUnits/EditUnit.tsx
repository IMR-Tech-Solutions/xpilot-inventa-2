import { Modal, Form, Input } from "antd";
import { UnitData } from "./ViewUnit";
import { useEffect } from "react";
import { updateUnitService } from "../../services/productservices";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";

const EditUnit = ({
  unitData,
  visible,
  onCancel,
  fetchAllUnits,
}: {
  unitData: UnitData;
  visible: boolean;
  onCancel: () => void;
  fetchAllUnits: () => void;
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (unitData && visible) {
      form.setFieldsValue({
        unitName: unitData.unitName,
      });
    }
  }, [unitData, visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const unitID = unitData.id;
      const formData = new FormData();
      formData.append("unitName", values.unitName);
      await updateUnitService(unitID, formData);
      toast.success("Unit Updated Successfully");
      fetchAllUnits();
      onCancel();
    } catch (err) {
      console.error("Error updating unit:", err);
      handleError(err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Edit Unit"
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="Save"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical" name="edit_unit">
        <Form.Item
          label="Unit Name"
          name="unitName"
          rules={[
            { required: true, message: "Please input the unit name!" },
            { min: 2, message: "Unit name must be at least 2 characters!" },
          ]}
        >
          <Input placeholder="Enter Unit name" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditUnit;
