import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import {
  getorderstatusservice,
  confrimshoporderservice,
  cancelshoporderservice,
  getshopownerproductinvoicedownload,
  getshopownerproductinvoiceview,
} from "../../services/shopservices";
import { useEffect, useState } from "react";
import { handleError } from "../../utils/handleError";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { Popconfirm, Table, Button, Space, Tag } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";

interface OrderItem {
  item_id: number;
  product_name: string;
  requested_quantity: number;
  fulfilled_quantity: number;
  fulfilled_by_manager: string;
  actual_price: number;
  status: string;
}

interface FulfillmentSummary {
  total_items: number;
  fulfilled_items: number;
  pending_items: number;
  completion_percentage: number;
}

interface OrderData {
  order_number: string;
  order_status: string;
  fulfillment_summary: FulfillmentSummary;
  items_status: OrderItem[];
  total_amount: number;
  created_at: string;
}

const ShopOwnerOrderStatus = () => {
  const { orderID } = useParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Track per-row button loading
  const [loadingButtons, setLoadingButtons] = useState<{
    [key: number]: "view" | "download" | null;
  }>({});

  let actualOrderID: number | null = null;
  if (orderID) {
    try {
      actualOrderID = parseInt(atob(orderID), 10);
    } catch (e) {
      console.error("Invalid order ID in URL", e);
    }
  }

  const fetchOrderData = async () => {
    try {
      if (actualOrderID) {
        setLoading(true);
        const response = await getorderstatusservice(actualOrderID);
        setOrderData(response);
      }
    } catch (e) {
      handleError(e);
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!actualOrderID) return;
    setConfirmLoading(true);
    try {
      await confrimshoporderservice(actualOrderID);
      toast.success("Delivery confirmed successfully!");
      fetchOrderData();
    } catch (error) {
      handleError(error);
      console.error("Error confirming delivery:", error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!actualOrderID) return;
    setCancelLoading(true);
    try {
      await cancelshoporderservice(actualOrderID);
      toast.success("Order cancelled successfully!");
      fetchOrderData();
    } catch (error) {
      handleError(error);
      console.error("Error cancelling order:", error);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleView = async (itemId: number) => {
    setLoadingButtons((prev) => ({ ...prev, [itemId]: "view" }));
    const toastId = toast.loading("Opening invoice...");
    console.log(actualOrderID);
    console.log(itemId);
    try {
      await getshopownerproductinvoiceview(actualOrderID!, itemId);
      toast.update(toastId, {
        render: "Invoice opened successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error viewing invoice:", error);
      handleError(error);
      toast.update(toastId, {
        render: "Failed to open invoice",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [itemId]: null }));
    }
  };

  const handleDownload = async (itemId: number) => {
    setLoadingButtons((prev) => ({ ...prev, [itemId]: "download" }));
    const toastId = toast.loading("Downloading invoice...");
    try {
      await getshopownerproductinvoicedownload(actualOrderID!, itemId);
      toast.update(toastId, {
        render: "Invoice downloaded successfully!",
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
      setLoadingButtons((prev) => ({ ...prev, [itemId]: null }));
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [actualOrderID]);

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("DD-MM-YYYY");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fulfilled":
        return "green";
      case "pending":
        return "orange";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: OrderItem, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      sorter: (a: OrderItem, b: OrderItem) =>
        a.product_name.localeCompare(b.product_name),
      render: (name: string) => (
        <span className="text-gray-800 dark:text-white/90 truncate">
          {name}
        </span>
      ),
    },
    {
      title: "Requested Qty",
      dataIndex: "requested_quantity",
      key: "requested_quantity",
      sorter: (a: OrderItem, b: OrderItem) =>
        a.requested_quantity - b.requested_quantity,
    },
    {
      title: "Fulfilled Qty",
      dataIndex: "fulfilled_quantity",
      key: "fulfilled_quantity",
      sorter: (a: OrderItem, b: OrderItem) =>
        a.fulfilled_quantity - b.fulfilled_quantity,
      render: (qty: number) => (
        <span className="font-medium text-green-600">{qty}</span>
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "actual_price",
      key: "actual_price",
      sorter: (a: OrderItem, b: OrderItem) => a.actual_price - b.actual_price,
      render: (price: number) => `₹${price}`,
    },
    {
      title: "Total Price",
      key: "total_price",
      render: (record: OrderItem) => (
        <span className="font-medium">
          ₹{(record.actual_price * record.fulfilled_quantity).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Fulfilled By",
      dataIndex: "fulfilled_by_manager",
      key: "fulfilled_by_manager",
      sorter: (a: OrderItem, b: OrderItem) =>
        (a.fulfilled_by_manager || "").localeCompare(
          b.fulfilled_by_manager || ""
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a: OrderItem, b: OrderItem) => a.status.localeCompare(b.status),
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
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
            loading={loadingButtons[record.item_id] === "view"}
            onClick={() => handleView(record.item_id)}
          />
          <Button
            id="table-download-btn"
            size="small"
            icon={<DownloadOutlined />}
            loading={loadingButtons[record.item_id] === "download"}
            onClick={() => handleDownload(record.item_id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="Order Status"
        description="View detailed order status and fulfillment information."
      />

      <ButtonComponentCard
        title={`Order: ${orderData?.order_number || "Loading..."}`}
        buttonlink=""
        buttontitle=""
      >
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold dark:text-white">
              {orderData?.fulfillment_summary?.total_items || 0}
            </div>
            <div className="text-sm theme-text">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {orderData?.fulfillment_summary?.fulfilled_items || 0}
            </div>
            <div className="text-sm theme-text">Fulfilled Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {orderData?.fulfillment_summary?.pending_items || 0}
            </div>
            <div className="text-sm theme-text">Pending Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {orderData?.fulfillment_summary?.completion_percentage?.toFixed(
                1
              ) || 0}
              %
            </div>
            <div className="text-sm theme-text">Completion %</div>
          </div>
        </div>

        {/* Order Basic Info */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
          <div>
            <span className="theme-text text-sm">Order Status:</span>
            <div
              className={`font-semibold capitalize ${getOrderStatusColor(
                orderData?.order_status || ""
              )}`}
            >
              {orderData?.order_status || "N/A"}
            </div>
          </div>
          <div>
            <span className="theme-text text-sm">Total Amount:</span>
            <div className="font-semibold theme-text-2">
              ₹{orderData?.total_amount?.toLocaleString() || 0}
            </div>
          </div>
          <div>
            <span className="theme-text text-sm">Created At:</span>
            <div className="font-semibold theme-text-2">
              {orderData?.created_at ? formatDate(orderData.created_at) : "N/A"}
            </div>
          </div>
        </div>

        {orderData?.order_status === "delivery_in_progress" && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  Ready for Delivery Confirmation
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Your order is ready to be delivered. Click confirm when you
                  receive your products.
                </p>
              </div>
              <button
                onClick={handleConfirmDelivery}
                disabled={confirmLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                {confirmLoading ? "Confirming..." : "Confirm Delivery"}
              </button>
            </div>
          </div>
        )}
      </ButtonComponentCard>

      {/* Items Status Table */}
      <div className="mt-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold theme-text-2">Order Items</h2>
            <p className="text-sm theme-text">
              Detailed status of each item in the order
            </p>
          </div>
          <div className="">
            <Popconfirm
              title={`Are you sure you want to cancel the order ?`}
              onConfirm={handleCancelOrder}
              okText="Yes, Cancel"
              cancelText="Cancel"
            >
              <button
                disabled={cancelLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors text-sm"
              >
                {cancelLoading ? "Cancelling..." : "Cancel Order"}
              </button>
            </Popconfirm>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={orderData?.items_status || []}
          loading={loading}
          rowKey={(record) => record.item_id}
          className="custom-orders-table"
          pagination={{
            pageSize: 10,
          }}
          onChange={(pagination) => {
            setCurrentPage(pagination.current || 1);
          }}
          scroll={{ x: 800 }}
          locale={{ emptyText: "No items found." }}
        />
      </div>
    </div>
  );
};

export default ShopOwnerOrderStatus;
