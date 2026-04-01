import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { Table, Button, Space, Tag, Select } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getallmanagersshoporders,
  getmanagershoporderinvoice,
  getmanagershoporderinvoicedownload,
  getmanagershoporderdeliverychalandownload,
  updateManagerOrderStatusService,
} from "../../services/shopservices";
import {
  EyeOutlined,
  DownloadOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import dayjs from "dayjs";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

interface ShopOrder {
  id: number;
  order_number: string;
  shop_owner_name: string;
  order_status: string;
  items_count: number;
  total_amount: number;
  created_at: string;
}

// Statuses the manager is allowed to transition TO
const MANAGER_STATUS_OPTIONS = [
  { value: "packing", label: "Packing" },
  { value: "delivery_in_progress", label: "Delivery In Progress" },
  { value: "cancelled", label: "Cancelled" },
];

// Statuses where the dropdown should be locked (no further manager changes)
const LOCKED_STATUSES = new Set([
  "completed",
  "cancelled",
  "delivery_in_progress",
]);

const AllShopOrders = () => {
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [loadingButtons, setLoadingButtons] = useState<{
    [key: number]: {
      view?: boolean;
      invoice?: boolean;
      chalan?: boolean;
      status?: boolean;
    };
  }>({});

  const fetchShopOrders = async () => {
    setLoading(true);
    try {
      const data = await getallmanagersshoporders();
      setShopOrders(data);
    } catch (err) {
      console.error("Error fetching shop orders:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopOrders();
  }, []);

  const getOrderStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      order_placed: "orange",
      partially_fulfilled: "blue",
      packing: "cyan",
      delivery_in_progress: "purple",
      completed: "green",
      cancelled: "red",
    };
    return colors[status] || "default";
  };

  // ── Status update handler ──────────────────────────────────────────────────
  const handleStatusChange = async (orderID: number, newStatus: string) => {
    setLoadingButtons((prev) => ({
      ...prev,
      [orderID]: { ...prev[orderID], status: true },
    }));
    try {
      await updateManagerOrderStatusService(orderID, newStatus);
      // Optimistic update — replace status in local state
      setShopOrders((prev) =>
        prev.map((o) =>
          o.id === orderID ? { ...o, order_status: newStatus } : o,
        ),
      );
      toast.success(`Order status updated to "${newStatus.replace("_", " ")}"`);
    } catch (error) {
      console.error("Error updating order status:", error);
      handleError(error);
    } finally {
      setLoadingButtons((prev) => ({
        ...prev,
        [orderID]: { ...prev[orderID], status: false },
      }));
    }
  };

  // ── PDF handlers ───────────────────────────────────────────────────────────
  const handleView = async (orderID: number) => {
    setLoadingButtons((prev) => ({
      ...prev,
      [orderID]: { ...prev[orderID], view: true },
    }));
    const toastId = toast.loading("Opening order details...");
    try {
      await getmanagershoporderinvoice(orderID);
      toast.update(toastId, {
        render: "Order details opened successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error viewing order:", error);
      handleError(error);
      toast.update(toastId, {
        render: "Failed to open order details",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    } finally {
      setLoadingButtons((prev) => ({
        ...prev,
        [orderID]: { ...prev[orderID], view: false },
      }));
    }
  };

  const handleDownload = async (orderID: number) => {
    setLoadingButtons((prev) => ({
      ...prev,
      [orderID]: { ...prev[orderID], invoice: true },
    }));
    const toastId = toast.loading("Downloading order invoice...");
    try {
      await getmanagershoporderinvoicedownload(orderID);
      toast.update(toastId, {
        render: "Order invoice downloaded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      handleError(error);
      toast.update(toastId, {
        render: "Failed to download invoice",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    } finally {
      setLoadingButtons((prev) => ({
        ...prev,
        [orderID]: { ...prev[orderID], invoice: false },
      }));
    }
  };

  const handledownloaddeliverychalan = async (orderID: number) => {
    setLoadingButtons((prev) => ({
      ...prev,
      [orderID]: { ...prev[orderID], chalan: true },
    }));
    const toastId = toast.loading("Downloading delivery chalan...");
    try {
      await getmanagershoporderdeliverychalandownload(orderID);
      toast.update(toastId, {
        render: "E-bill chalan downloaded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error downloading E-bill:", error);
      handleError(error);
      toast.update(toastId, {
        render: "Failed to download E-bill",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    } finally {
      setLoadingButtons((prev) => ({
        ...prev,
        [orderID]: { ...prev[orderID], chalan: false },
      }));
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: ShopOrder, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Order Number",
      dataIndex: "order_number",
      key: "order_number",
      sorter: (a: ShopOrder, b: ShopOrder) =>
        (a.order_number || "").localeCompare(b.order_number || ""),
      render: (orderNumber: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {orderNumber || "N/A"}
        </span>
      ),
    },
    {
      title: "Shop Owner",
      dataIndex: "shop_owner_name",
      key: "shop_owner_name",
      sorter: (a: ShopOrder, b: ShopOrder) =>
        (a.shop_owner_name || "").localeCompare(b.shop_owner_name || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Items Count",
      dataIndex: "items_count",
      key: "items_count",
      sorter: (a: ShopOrder, b: ShopOrder) => a.items_count - b.items_count,
      render: (count: number) => (
        <span className="font-medium text-blue-600">{count}</span>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "order_status",
      key: "order_status",
      sorter: (a: ShopOrder, b: ShopOrder) =>
        (a.order_status || "").localeCompare(b.order_status || ""),
      render: (currentStatus: string, record: ShopOrder) => {
        const isLocked = LOCKED_STATUSES.has(currentStatus);

        if (isLocked) {
          // Show a plain read-only tag for terminal / locked statuses
          return (
            <Tag
              color={getOrderStatusColor(currentStatus)}
              className="capitalize"
            >
              {currentStatus
                ? currentStatus.replace(/_/g, " ").toUpperCase()
                : "N/A"}
            </Tag>
          );
        }

        return (
          <Select
            value={currentStatus}
            size="small"
            style={{ minWidth: 170 }}
            loading={loadingButtons[record.id]?.status}
            disabled={loadingButtons[record.id]?.status}
            onChange={(newStatus: string) =>
              handleStatusChange(record.id, newStatus)
            }
            options={[
              // Show the current status at the top as a disabled display option
              // so the user can see what it is before selecting
              {
                value: currentStatus,
                label: (
                  <Tag
                    color={getOrderStatusColor(currentStatus)}
                    style={{ margin: 0 }}
                  >
                    {currentStatus.replace(/_/g, " ").toUpperCase()}
                  </Tag>
                ),
              },
              // Separator then allowed transitions
              ...MANAGER_STATUS_OPTIONS.filter(
                (opt) => opt.value !== currentStatus,
              ),
            ]}
          />
        );
      },
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      sorter: (a: ShopOrder, b: ShopOrder) => a.total_amount - b.total_amount,
      render: (amount: number) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          ₹{amount?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      title: "Order Date",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a: ShopOrder, b: ShopOrder) =>
        dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {date ? dayjs(date).format("DD MMM YYYY") : "N/A"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ShopOrder) => (
        <Space size="small">
          <Button
            id="table-view-btn"
            size="small"
            icon={<EyeOutlined />}
            loading={loadingButtons[record.id]?.view}
            onClick={() => handleView(record.id)}
          />
          <Button
            id="table-download-btn"
            size="small"
            icon={<DownloadOutlined />}
            loading={loadingButtons[record.id]?.invoice}
            onClick={() => handleDownload(record.id)}
          />
          <Button
            id="table-download-btn"
            size="small"
            icon={<TruckOutlined />}
            loading={loadingButtons[record.id]?.chalan}
            onClick={() => handledownloaddeliverychalan(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="All Franchise Orders"
        description="View all franchise orders fulfilled by managers."
      />
      <PageBreadcrumb pageTitle="All Franchise Orders" />
      <ButtonComponentCard
        title="Manager Fulfilled Orders"
        buttonlink=""
        buttontitle=""
      >
        <Table
          columns={columns}
          dataSource={shopOrders}
          loading={loading}
          rowKey="id"
          className="custom-orders-table"
          pagination={{
            pageSize: 10,
          }}
          onChange={(pagination) => {
            setCurrentPage(pagination.current || 1);
          }}
          scroll={{ x: 900 }}
          locale={{ emptyText: "No shop orders found." }}
        />
      </ButtonComponentCard>
    </div>
  );
};

export default AllShopOrders;
