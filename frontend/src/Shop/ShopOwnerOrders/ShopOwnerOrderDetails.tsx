import { Modal, Descriptions, Tag, Table } from "antd";
import dayjs from "dayjs";
import { ShopOwnerOrderDetailsType } from "../../types/types";

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    pending: "orange",
    order_placed: "blue",
    partially_fulfilled: "purple",
    completed: "green",
    cancelled: "red",
  };
  return colors[status] || "default";
};

const ShopOwnerOrderDetails = ({
  selectedOrder,
  visible,
  onCancel,
}: {
  selectedOrder: ShopOwnerOrderDetailsType;
  visible: boolean;
  onCancel: () => void;
}) => {
  const order = selectedOrder.order;

  const columns = [
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      render: (text: string, record: any) => (
        <span>
          <strong>{text}</strong> ({record.product_sku})
        </span>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "requested_quantity",
      key: "requested_quantity",
      render: (qty: number) => <Tag color="cyan">{qty} units</Tag>,
    },
  ];

  return (
    <Modal
      title={`Order Summary - ${order.order_number}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Descriptions
        bordered
        column={1}
        size="small"
        labelStyle={{ fontWeight: "bold", width: "35%" }}
      >
        <Descriptions.Item label="Order Number">
          <Tag color="blue">{order.order_number}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Order Placed by">
          {order.shop_owner_name}
        </Descriptions.Item>

        <Descriptions.Item label="Order Status">
          <Tag color={getStatusColor(order.status)}>{order.status}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Created At">
          {dayjs(order.created_at).format("DD MMM YYYY, hh:mm A")}
        </Descriptions.Item>
      </Descriptions>

      <div className="mt-4">
        <h3 className="font-semibold mb-2 text-white">Order Items</h3>
        <Table
          dataSource={order.order_items_details}
          columns={columns}
          rowKey="product"
          className="modal-table-class"
          pagination={{
            pageSize: 10,
          }}
          size="small"
        />
      </div>
    </Modal>
  );
};

export default ShopOwnerOrderDetails;
