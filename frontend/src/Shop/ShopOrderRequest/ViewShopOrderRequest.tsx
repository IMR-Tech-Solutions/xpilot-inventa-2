import {
  Modal,
  Button,
  Descriptions,
  Tag,
  Popconfirm,
  InputNumber,
  Space,
  Alert,
} from "antd";
import { useState, useEffect } from "react";
import { CheckOutlined, EditOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import { acceptshoporderrequestservice } from "../../services/shoprequesthandlingservice";
import { ShopOrderRequestDetailedView } from "../../types/types";

const ViewShopOrderRequest = ({
  fetchshoprequests,
  visible,
  onCancel,
  viewOrderRequest,
}: {
  viewOrderRequest: ShopOrderRequestDetailedView;
  visible: boolean;
  onCancel: () => void;
  fetchshoprequests: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [offeredQuantity, setOfferedQuantity] = useState<number | null>(null);
  const [showCustomQuantity, setShowCustomQuantity] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState<number | null>(null);

  // Destructure the new payload structure
  const { request_details, stock_info } = viewOrderRequest;

  // Initialise price to product's selling_price whenever modal opens
  const defaultPrice = stock_info.product_selling_price ?? null;

  useEffect(() => {
    setOfferedPrice(defaultPrice);
  }, [viewOrderRequest]);

  const acceptRequest = async (requestID: number, customQuantity?: number) => {
    if (!offeredPrice || offeredPrice <= 0) {
      toast.error("Please enter a valid selling price before accepting.");
      return;
    }

    try {
      setLoading(true);

      const payload: { offered_quantity?: number; offered_price: number } = {
        offered_price: offeredPrice,
      };
      if (customQuantity) payload.offered_quantity = customQuantity;

      const response = await acceptshoporderrequestservice(requestID, payload);
      toast.success(response.message);

      if (response.fulfillment) {
        toast.info(response.fulfillment.message);
      }

      fetchshoprequests();
      onCancel();
    } catch (error) {
      console.error("Error accepting request:", error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptFullQuantity = () => {
    acceptRequest(request_details.id);
  };

  const handleAcceptCustomQuantity = () => {
    if (!offeredQuantity || offeredQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (offeredQuantity > stock_info.available_quantity) {
      toast.error("Offered quantity cannot exceed available stock");
      return;
    }
    acceptRequest(request_details.id, offeredQuantity);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "orange",
      accepted: "green",
      rejected: "red",
      fulfilled: "blue",
      cancelled: "gray",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStockStatusAlert = () => {
    if (stock_info.can_fulfill_fully) {
      return (
        <Alert
          message="Stock Available"
          description={`Full quantity can be fulfilled. ${stock_info.available_quantity} units available.`}
          type="success"
          showIcon
          className="mb-4"
        />
      );
    } else {
      return (
        <Alert
          message="Partial Stock Available"
          description={`Only ${stock_info.available_quantity} units available. Shortage: ${stock_info.shortage} units.`}
          type="warning"
          showIcon
          className="mb-4"
        />
      );
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <span>Shop Request Details</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={
        request_details.status === "pending"
          ? [
              <div className="flex justify-end gap-2 flex-wrap">
                <Button
                  key="custom"
                  onClick={() => setShowCustomQuantity(!showCustomQuantity)}
                  icon={<EditOutlined />}
                >
                  {showCustomQuantity ? "Cancel Custom" : "Custom Quantity"}
                </Button>

                <Popconfirm
                  key="accept"
                  title="Are you sure to accept this order request with full quantity?"
                  onConfirm={handleAcceptFullQuantity}
                  okText="Yes, Accept"
                  cancelText="Cancel"
                  disabled={!stock_info.can_fulfill_fully}
                >
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={loading}
                    disabled={!stock_info.can_fulfill_fully}
                  >
                    Accept Full Request
                  </Button>
                </Popconfirm>

                <Button key="close" onClick={onCancel}>
                  Close
                </Button>
              </div>,
            ]
          : [
              <Button key="close" onClick={onCancel}>
                Close
              </Button>,
            ]
      }
    >
      {getStockStatusAlert()}

      <Descriptions
        bordered
        column={1}
        size="small"
        labelStyle={{ fontWeight: "bold", width: "40%" }}
      >
        <Descriptions.Item label="Order Number">
          <Tag color="blue">{request_details.order_number}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Product">
          <div>
            <strong>{request_details.product_name}</strong>
            <br />
            <span className="text-gray-500">
              SKU: {request_details.product_sku}
            </span>
          </div>
        </Descriptions.Item>

        <Descriptions.Item label="Shop Owner">
          {request_details.shop_owner_name}
        </Descriptions.Item>

        <Descriptions.Item label="Stock Information">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Available Quantity:</span>
              <Tag color="green">{stock_info.available_quantity} units</Tag>
            </div>
            <div className="flex justify-between items-center">
              <span>Requested Quantity:</span>
              <Tag color="blue">{stock_info.requested_quantity} units</Tag>
            </div>
            {stock_info.shortage > 0 && (
              <div className="flex justify-between items-center">
                <span>Shortage:</span>
                <Tag color="red">{stock_info.shortage} units</Tag>
              </div>
            )}
          </div>
        </Descriptions.Item>

        {request_details.status === "pending" && (
          <Descriptions.Item label="Selling Price (₹)">
            <div className="space-y-1">
              <InputNumber
                min={0.01}
                step={0.01}
                precision={2}
                value={offeredPrice ?? undefined}
                onChange={(val) => setOfferedPrice(val)}
                style={{ width: "100%" }}
                placeholder="Enter price"
              />
              {defaultPrice !== null && (
                <div className="text-xs text-gray-400">
                  Default (product selling price): ₹{defaultPrice.toFixed(2)}
                </div>
              )}
            </div>
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Request Status">
          <Tag color={getStatusColor(request_details.status)}>
            {request_details.status.toUpperCase()}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Manager Response">
          {request_details.manager_response_notes || (
            <span className="text-gray-400 italic">No response notes</span>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Response Date">
          {formatDate(request_details.response_date)}
        </Descriptions.Item>

        <Descriptions.Item label="Request Created">
          {formatDate(request_details.created_at)}
        </Descriptions.Item>
      </Descriptions>

      {/* Custom Quantity Section */}
      {showCustomQuantity && request_details.status === "pending" && (
        <div className="mt-4 p-4  bg-blue-900/20 rounded-lg border border-blue-200 ">
          <div className="mb-3">
            <strong className="text-white">Offer Custom Quantity:</strong>
          </div>
          <Space direction="vertical" className="w-full">
            <div>
              <label className="block text-sm font-medium mb-1 text-white">
                Quantity to Offer (Max: {stock_info.available_quantity})
              </label>
              <InputNumber
                min={1}
                max={stock_info.available_quantity}
                value={offeredQuantity}
                onChange={(value) => setOfferedQuantity(value)}
                placeholder="Enter quantity"
                style={{ width: "100%" }}
              />
            </div>
            <Popconfirm
              title={`Are you sure to accept with ${offeredQuantity} units?`}
              onConfirm={handleAcceptCustomQuantity}
              okText="Yes, Accept"
              cancelText="Cancel"
            >
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={loading}
                disabled={!offeredQuantity || offeredQuantity <= 0}
                block
              >
                Accept with {offeredQuantity || 0} units
              </Button>
            </Popconfirm>
          </Space>
        </div>
      )}

      {request_details.status === "pending" && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Action Required:</strong> This request is waiting for your
            response.
            {!stock_info.can_fulfill_fully && (
              <span>
                {" "}
                Consider offering a partial quantity as full stock is not
                available.
              </span>
            )}
          </p>
        </div>
      )}
    </Modal>
  );
};

export default ViewShopOrderRequest;
