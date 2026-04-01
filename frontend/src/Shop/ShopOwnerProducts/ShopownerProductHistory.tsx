import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { getpurchaseproducthistory } from "../../services/shopservices";
import { useEffect, useState } from "react";
import { handleError } from "../../utils/handleError";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import dayjs from "dayjs";
import { Table, Tag } from "antd";

interface PurchaseHistoryItem {
  purchase_date: string;
  quantity: number;
  order_number: string;
  order_status: string;
}

interface ApiResponse {
  product_info: {
    product_name: string;
    product_sku: string;
    current_quantity: number;
    current_selling_price: string;
    is_active: boolean;
  };
  purchase_history: PurchaseHistoryItem[];
  total_purchases: number;
  total_quantity_purchased: number;
}

const ShopownerProductHistory = () => {
  const { productID } = useParams();
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>(
    []
  );
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  let actualProductID: number | null = null;
  if (productID) {
    try {
      actualProductID = parseInt(atob(productID), 10);
    } catch (e) {
      console.error("Invalid product ID in URL", e);
    }
  }

  const fetchPurchaseHistory = async () => {
    try {
      if (actualProductID) {
        setLoading(true);
        const response = await getpurchaseproducthistory(actualProductID);
        setApiResponse(response);
        setPurchaseHistory(response.purchase_history);
      }
    } catch (e) {
      handleError(e);
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseHistory();
  }, [actualProductID]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "pending":
        return "orange";
      case "cancelled":
        return "red";
      case "delivery_in_progress":
        return "blue";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: PurchaseHistoryItem, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Purchase Date",
      dataIndex: "purchase_date",
      key: "purchase_date",
      sorter: (a: PurchaseHistoryItem, b: PurchaseHistoryItem) =>
        new Date(a.purchase_date).getTime() -
        new Date(b.purchase_date).getTime(),
      render: (date: string) => (
        <span className="text-gray-800 dark:text-white/90">
          {dayjs(date).format("DD-MM-YYYY")}
        </span>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a: PurchaseHistoryItem, b: PurchaseHistoryItem) =>
        a.quantity - b.quantity,
      render: (quantity: number) => (
        <span className="font-medium text-blue-600">{quantity} units</span>
      ),
    },
    {
      title: "Order Number",
      dataIndex: "order_number",
      key: "order_number",
      sorter: (a: PurchaseHistoryItem, b: PurchaseHistoryItem) =>
        a.order_number.localeCompare(b.order_number),
      render: (orderNumber: string) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {orderNumber}
        </span>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "order_status",
      key: "order_status",
      sorter: (a: PurchaseHistoryItem, b: PurchaseHistoryItem) =>
        a.order_status.localeCompare(b.order_status),
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status.replace("_", " ")}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="Product Purchase History"
        description="View purchase history for this product."
      />

      <ButtonComponentCard
        title={`Purchase History - ${
          apiResponse?.product_info?.product_name || "Product"
        }`}
        buttonlink=""
        buttontitle=""
      >
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold dark:text-white">
              {apiResponse?.total_purchases || 0}
            </div>
            <div className="text-sm theme-text">Total Purchases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {apiResponse?.total_quantity_purchased || 0}
            </div>
            <div className="text-sm theme-text">Total Quantity</div>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={purchaseHistory}
          loading={loading}
          rowKey={(record) => `${record.order_number}-${record.purchase_date}`}
          className="custom-orders-table"
          pagination={{
            pageSize: 10,
          }}
          onChange={(pagination) => {
            setCurrentPage(pagination.current || 1);
          }}
          scroll={{ x: 800 }}
          locale={{ emptyText: "No purchase history found." }}
        />
      </ButtonComponentCard>
    </div>
  );
};

export default ShopownerProductHistory;
