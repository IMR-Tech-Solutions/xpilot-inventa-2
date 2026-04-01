import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space, Tag } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getallmyshopordersservice,
  getshopownerorderdetail,
} from "../../services/shopservices";
import {
  // EyeOutlined,
  // DownloadOutlined,
  // EditOutlined,
  FileTextOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { ShopOwnerOrder, ShopOwnerOrderDetailsType } from "../../types/types";
import { handleError } from "../../utils/handleError";
import dayjs from "dayjs";
import ShopOwnerOrderDetails from "./ShopOwnerOrderDetails";
import { useNavigate } from "react-router";

const { Search } = Input;

const ShopOwnerOrders = () => {
  const [shopOwnerOrders, setShopOwnerOrders] = useState<ShopOwnerOrder[]>([]);
  const [filteredShopOwnerOrders, setFilteredShopOwnerOrders] = useState<
    ShopOwnerOrder[]
  >([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedShopOrder, setSelectedShopOrder] =
    useState<ShopOwnerOrderDetailsType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchShopownerOrders = async () => {
    setLoading(true);
    try {
      const data = await getallmyshopordersservice();
      setShopOwnerOrders(data);
      setFilteredShopOwnerOrders(data);
    } catch (err) {
      console.error("Error fetching shop orders:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopownerOrders();
  }, []);

  const handleSearch = (value: string) => {
    const filtered = shopOwnerOrders.filter(
      (Shoporder) =>
        Shoporder.order_number
          ?.toString()
          .toLowerCase()
          .includes(value.toLowerCase()) ||
        Shoporder.status?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredShopOwnerOrders(filtered);
    setCurrentPage(1);
  };

  const getOrderStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "orange",
      order_placed: "blue",
      partially_fulfilled: "purple",
      completed: "green",
      cancelled: "red",
    };
    return colors[status] || "default";
  };

  const orderSummary = async (shopownerorderID: number) => {
    try {
      const shoporderData = await getshopownerorderdetail(shopownerorderID);
      setSelectedShopOrder(shoporderData);
      setModalVisible(true);
    } catch (error) {
      console.error("Unable view summary", error);
      handleError(error);
    }
  };

  const checkOrderStatus = async (orderID: number) => {
    const encodedID = btoa(orderID.toString());
    navigate(`/shop/order/${encodedID}`);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: ShopOwnerOrder, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Order Placed",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a: ShopOwnerOrder, b: ShopOwnerOrder) =>
        dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {date ? dayjs(date).format("DD MMM YYYY") : "N/A"}
        </span>
      ),
    },
    {
      title: "Order Number",
      dataIndex: "order_number",
      key: "order_number",
      sorter: (a: ShopOwnerOrder, b: ShopOwnerOrder) =>
        (a.order_number || "").localeCompare(b.order_number || ""),
      render: (num: number) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {num ?? "N/A"}
        </span>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "status",
      key: "status",
      sorter: (a: ShopOwnerOrder, b: ShopOwnerOrder) =>
        (a.status || "").localeCompare(b.status || ""),
      render: (status: string) => (
        <Tag
          color={getOrderStatusColor(status)}
          className="capitalize small-tag"
        >
          {status ? status.replace("_", " ").toUpperCase() : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Items Count",
      dataIndex: "items_count",
      key: "items_count",
      sorter: (a: ShopOwnerOrder, b: ShopOwnerOrder) =>
        a.items_count - b.items_count,
      render: (name: string) => (
        <span className="text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ShopOwnerOrder) => (
        <Space size="small">
          <Button
            id="table-view-btn"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => orderSummary(record.id)}
          />
          <Button
            id="table-manage-btn"
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => checkOrderStatus(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="All Orders"
        description="Manage and organize all orders seamlessly with Inventa."
      />
      <PageBreadcrumb pageTitle="Orders" />
      <ButtonComponentCard title="View All Orders">
        <div className="mb-4">
          <Search
            placeholder="Search orders..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredShopOwnerOrders}
          loading={loading}
          rowKey="id"
          className="custom-orders-table"
          pagination={{
            pageSize: 10,
          }}
          onChange={(pagination) => {
            setCurrentPage(pagination.current || 1);
          }}
          scroll={{ x: 800 }}
          locale={{ emptyText: "No orders found." }}
        />
      </ButtonComponentCard>
      {selectedShopOrder && (
        <ShopOwnerOrderDetails
          selectedOrder={selectedShopOrder}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default ShopOwnerOrders;
