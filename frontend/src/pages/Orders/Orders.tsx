import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space, Tag } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getmyposordersservice,
  viewPOSorderService,
  downloadPOSorderService,
} from "../../services/posorderservices";
import { EyeOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { OrderItem } from "../../types/types";
import { handleError } from "../../utils/handleError";
import dayjs from "dayjs";
import EditOrders from "./EditOrders";

const { Search } = Input;

const Orders = () => {
  const [posOrders, setPosOrders] = useState<OrderItem[]>([]);
  const [filteredPosOrders, setFilteredposOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [updatePosOrder, setUpdatePosOrder] = useState<OrderItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // track per-row button loading
  const [loadingButtons, setLoadingButtons] = useState<{
    [key: number]: "view" | "download" | null;
  }>({});

  const fetchPOSorders = async () => {
    setLoading(true);
    try {
      const data = await getmyposordersservice();
      setPosOrders(data);
      setFilteredposOrders(data);
    } catch (err) {
      console.error("Error fetching pos orders:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOSorders();
  }, []);

  const handleSearch = (value: string) => {
    const filtered = posOrders.filter(
      (order) =>
        order.order_number
          ?.toString()
          .toLowerCase()
          .includes(value.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredposOrders(filtered);
    setCurrentPage(1);
  };

  const getOrderStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "orange",
      confirmed: "blue",
      processing: "purple",
      ready: "cyan",
      completed: "green",
      cancelled: "red",
    };
    return colors[status] || "default";
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "orange",
      paid: "green",
      partial: "gold",
      failed: "red",
      refunded: "gray",
    };
    return colors[status] || "default";
  };

  // --- ACTION HANDLERS ---
  const handleView = async (posorderID: number) => {
    setLoadingButtons((prev) => ({ ...prev, [posorderID]: "view" }));
    const toastId = toast.loading("Opening order invoice...");
    try {
      await viewPOSorderService(posorderID);
      toast.update(toastId, {
        render: "Order Invoice opened successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error viewing order invoice:", error);
      handleError(error);
      toast.update(toastId, {
        render: "Failed to open order invoice",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [posorderID]: null }));
    }
  };

  const handleDownload = async (posorderID: number) => {
    setLoadingButtons((prev) => ({ ...prev, [posorderID]: "download" }));
    const toastId = toast.loading("Downloading order invoice...");
    try {
      await downloadPOSorderService(posorderID);
      toast.update(toastId, {
        render: "Order Invoice downloaded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error downloading order invoice:", error);
      handleError(error);
      toast.update(toastId, {
        render: "Failed to download order invoice",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [posorderID]: null }));
    }
  };

  const handleEdit = (record: OrderItem) => {
    setUpdatePosOrder(record);
    setModalVisible(true);
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: OrderItem, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Order Date",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a: OrderItem, b: OrderItem) =>
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
      sorter: (a: OrderItem, b: OrderItem) =>
        (a.order_number || "").localeCompare(b.order_number || ""),
      render: (num: number) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {num ?? "N/A"}
        </span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customer_name",
      key: "customer_name",
      sorter: (a: OrderItem, b: OrderItem) =>
        (a.customer_name || "").localeCompare(b.customer_name || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "order_status",
      key: "order_status",
      sorter: (a: OrderItem, b: OrderItem) =>
        (a.order_status || "").localeCompare(b.order_status || ""),
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
      title: "Payment Status",
      dataIndex: "payment_status",
      key: "payment_status",
      sorter: (a: OrderItem, b: OrderItem) =>
        (a.payment_status || "").localeCompare(b.payment_status || ""),
      render: (status: string) => (
        <Tag
          color={getPaymentStatusColor(status)}
          className="capitalize small-tag"
        >
          {status ? status.replace("_", " ").toUpperCase() : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Order Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      sorter: (a: OrderItem, b: OrderItem) =>
        (a.total_amount || "").localeCompare(b.total_amount || ""),
      render: (name: string) => (
        <span className="text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: OrderItem) => (
        <Space size="small">
          <Button
            id="table-view-btn"
            size="small"
            icon={<EyeOutlined />}
            loading={loadingButtons[record.id] === "view"}
            onClick={() => handleView(record.id)}
          />
          <Button
            id="table-download-btn"
            size="small"
            icon={<DownloadOutlined />}
            loading={loadingButtons[record.id] === "download"}
            onClick={() => handleDownload(record.id)}
          />
          <Button
            id="table-update-btn"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="All POS Orders"
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
          dataSource={filteredPosOrders}
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
      {updatePosOrder && (
        <EditOrders
          fetchOrders={fetchPOSorders}
          selectedOrder={updatePosOrder}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default Orders;
