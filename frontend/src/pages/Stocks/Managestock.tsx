import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space, Tag } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getmystockentriesservice } from "../../services/stockbatchservices";
import { AppstoreOutlined } from "@ant-design/icons";
import { StockEntryItem } from "../../types/types";
import { handleError } from "../../utils/handleError";
import { all_routes } from "../../Router/allroutes";
import { useNavigate } from "react-router";
import dayjs from "dayjs";

const { Search } = Input;

const Managestock = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<StockEntryItem[]>([]);
  const [filtered, setFiltered] = useState<StockEntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await getmystockentriesservice();
      setEntries(data);
      setFiltered(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSearch = (value: string) => {
    const term = value.toLowerCase();
    setFiltered(
      entries.filter(
        (e) =>
          e.product_name?.toLowerCase().includes(term) ||
          e.vendor_name?.toLowerCase().includes(term) ||
          e.invoice_number?.toLowerCase().includes(term)
      )
    );
    setCurrentPage(1);
  };

  const handleViewProduct = (productId: number) => {
    navigate(`/manage-stock/product/${btoa(productId.toString())}`);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      width: 70,
      render: (_: any, __: StockEntryItem, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Product",
      dataIndex: "product_name",
      key: "product_name",
      sorter: (a: StockEntryItem, b: StockEntryItem) =>
        (a.product_name || "").localeCompare(b.product_name || ""),
      render: (name: string) => (
        <span className="font-medium text-gray-800 dark:text-white/90">{name}</span>
      ),
    },
    {
      title: "Vendor",
      dataIndex: "vendor_name",
      key: "vendor_name",
      render: (name: string) => (
        <span className="text-gray-700 dark:text-gray-300">{name || "—"}</span>
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a: StockEntryItem, b: StockEntryItem) => a.quantity - b.quantity,
      render: (qty: number) => (
        <Tag color="blue" className="font-semibold">{qty}</Tag>
      ),
    },
    {
      title: "Purchase Price",
      dataIndex: "purchase_price",
      key: "purchase_price",
      render: (price: string) => `₹${parseFloat(price).toFixed(2)}`,
    },
    {
      title: "Invoice No.",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (inv: string) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">{inv || "—"}</span>
      ),
    },
    {
      title: "Broker",
      dataIndex: "broker_name",
      key: "broker_name",
      render: (name: string | null) =>
        name ? <Tag color="green">{name}</Tag> : <span className="text-gray-400">—</span>,
    },
    {
      title: "MFG Date",
      dataIndex: "manufacture_date",
      key: "manufacture_date",
      render: (d: string) => (d ? dayjs(d).format("DD-MM-YYYY") : "—"),
    },
    {
      title: "Added On",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a: StockEntryItem, b: StockEntryItem) =>
        dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (d: string) => dayjs(d).format("DD-MM-YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: StockEntryItem) => (
        <Space size="small">
          <Button
            id="table-manage-btn"
            size="small"
            icon={<AppstoreOutlined />}
            title="View product stock"
            onClick={() => handleViewProduct(record.product)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta title="Manage Stock" description="View all stock entries" />
      <PageBreadcrumb pageTitle="Manage Stock" />
      <ButtonComponentCard
        title="All Stock Entries"
        buttonlink={all_routes.addstock}
        buttontitle="Add Stock"
      >
        <div className="mb-4">
          <Search
            placeholder="Search by product, vendor or invoice..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey="id"
          className="custom-orders-table"
          pagination={{ pageSize }}
          onChange={(pagination) => setCurrentPage(pagination.current || 1)}
          scroll={{ x: 900 }}
          locale={{ emptyText: "No stock entries found." }}
        />
      </ButtonComponentCard>
    </div>
  );
};

export default Managestock;
