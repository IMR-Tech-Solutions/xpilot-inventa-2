import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getallrequestformanagerservice,
  shoporderrequestdetailservice,
} from "../../services/shoprequesthandlingservice";
import ViewShopOrderRequest from "./ViewShopOrderRequest";
import {
  ShopOrderRequestPayload,
  ShopOrderRequestDetailedView,
} from "../../types/types";
import { handleError } from "../../utils/handleError";
import { all_routes } from "../../Router/allroutes";

const { Search } = Input;

const ShopOrderRequest = () => {
  const [shopOrderRequests, setShopOrderRequests] = useState<
    ShopOrderRequestPayload[]
  >([]);
  const [filteredshopOrderRequests, setfilteredshopOrderRequests] = useState<
    ShopOrderRequestPayload[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewShopOrderRequest, setViewShopOrderRequest] =
    useState<ShopOrderRequestDetailedView | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchShopOrderRequests = async () => {
    setLoading(true);
    try {
      const data = await getallrequestformanagerservice();
      setShopOrderRequests(data);
      setfilteredshopOrderRequests(data);
    } catch (err) {
      console.error("Error fetching shop requests:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopOrderRequests();
  }, []);

  const handleSearch = (value: string) => {
    const filtered = shopOrderRequests.filter((orderRequest) =>
      orderRequest.product_name?.toLowerCase().includes(value.toLowerCase())
    );
    setfilteredshopOrderRequests(filtered);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: ShopOrderRequestPayload, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Order Number",
      dataIndex: "order_number",
      key: "order_number",
      sorter: (a: ShopOrderRequestPayload, b: ShopOrderRequestPayload) =>
        (a.order_number || "").localeCompare(b.order_number || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Requested Quantity",
      dataIndex: "requested_quantity",
      key: "requested_quantity",
      sorter: (a: ShopOrderRequestPayload, b: ShopOrderRequestPayload) =>
        (a.requested_quantity || 0) - (b.requested_quantity || 0),
      render: (qty: number) => (
        <span className="text-gray-800 dark:text-white/90">{qty ?? "N/A"}</span>
      ),
    },
    {
      title: "Order Placed by",
      dataIndex: "shop_owner_name",
      key: "shop_owner_name",
      sorter: (a: ShopOrderRequestPayload, b: ShopOrderRequestPayload) =>
        (a.shop_owner_name || "").localeCompare(b.shop_owner_name || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ShopOrderRequestPayload) => (
        <Space size="small">
          <Button
            id="table-view-btn"
            size="small"
            loading={loading}
            onClick={() => viewShopOrder(record.id)}
          >
            View Request
          </Button>
        </Space>
      ),
    },
  ];

  const viewShopOrder = async (requestID: number) => {
    try {
      const ShopOrderRequestData = await shoporderrequestdetailservice(
        requestID
      );
      setViewShopOrderRequest(ShopOrderRequestData);
      setModalVisible(true);
    } catch (error) {
      console.error("Unable View order request:", error);
      handleError(error);
    }
  };

  return (
    <div>
      <PageMeta
        title="Shop Order Request"
        description="Manage and organize shop order request with Inventa."
      />
      <PageBreadcrumb pageTitle="Shop Order Request" />
      <ButtonComponentCard
        title="View All Requests"
        buttonlink={all_routes.shoporders}
        buttontitle="Show previous orders"
      >
        <div className="mb-4">
          <Search
            placeholder="Search order request..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredshopOrderRequests}
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
          locale={{ emptyText: "No order request found." }}
        />
      </ButtonComponentCard>
      {viewShopOrderRequest && (
        <ViewShopOrderRequest
          fetchshoprequests={fetchShopOrderRequests}
          viewOrderRequest={viewShopOrderRequest}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default ShopOrderRequest;
