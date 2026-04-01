import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getmyallshopproducts } from "../../services/shopservices";
import { EditOutlined, HistoryOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import EditPurchasedProductModal from "./EditPurchasedProductModal";
import { ShopPurchasedProduct } from "../../types/types";
import { handleError } from "../../utils/handleError";

const { Search } = Input;

const ShopOwnerProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ShopPurchasedProduct[]>([]);
  const [filteredProducts, setfilteredProducts] = useState<
    ShopPurchasedProduct[]
  >([]);
  const [selectedProduct, setSelectedProduct] =
    useState<ShopPurchasedProduct | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchAllPurchasedProducts = async () => {
    setLoading(true);
    try {
      const data = await getmyallshopproducts();
      setProducts(data);
      setfilteredProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPurchasedProducts();
  }, []);

  const handleSearch = (value: string) => {
    const searchTerm = value.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.product_name?.toLowerCase().includes(searchTerm) ||
        product.product_sku?.toLowerCase().includes(searchTerm) ||
        String(product?.category_name ?? "")
          .toLowerCase()
          .includes(searchTerm)
    );
    setfilteredProducts(filtered);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: ShopPurchasedProduct, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      sorter: (a: ShopPurchasedProduct, b: ShopPurchasedProduct) =>
        (a.product_name || "").localeCompare(b.product_name || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Product SKU",
      dataIndex: "product_sku",
      key: "product_sku",
      sorter: (a: ShopPurchasedProduct, b: ShopPurchasedProduct) =>
        (a.product_sku || "").localeCompare(b.product_sku || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a: ShopPurchasedProduct, b: ShopPurchasedProduct) =>
        a.quantity - b.quantity,
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Purchase Price",
      dataIndex: "purchase_price",
      key: "purchase_price",
      sorter: (a: ShopPurchasedProduct, b: ShopPurchasedProduct) =>
        (a.purchase_price || "").localeCompare(b.purchase_price || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Selling Price",
      dataIndex: "selling_price",
      key: "selling_price",
      sorter: (a: ShopPurchasedProduct, b: ShopPurchasedProduct) =>
        (a.selling_price || "").localeCompare(b.selling_price || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (
        <span
          className={
            isActive ? "text-green-600 font-medium" : "text-red-600 font-medium"
          }
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ShopPurchasedProduct) => (
        <Space size="small">
          <Button
            id="table-update-btn"
            size="small"
            icon={<EditOutlined />}
            loading={loading}
            onClick={() => handleEdit(record)}
          />
          <Button
            id="table-manage-btn"
            size="small"
            icon={<HistoryOutlined />}
            loading={loading}
            onClick={() => handleProductHistory(record.id)}
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (record: ShopPurchasedProduct) => {
    setSelectedProduct(record);
    setModalVisible(true);
  };

  const handleProductHistory = async (productID: number) => {
    const encodedID = btoa(productID.toString());
    navigate(`/shop/product/${encodedID}`);
  };

  return (
    <div>
      <PageMeta
        title="Products"
        description="Manage and organize products seamlessly with Inventa."
      />
      <PageBreadcrumb pageTitle="Products" />
      <ButtonComponentCard title="View All Products">
        <div className="mb-4">
          <Search
            placeholder="Search products..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredProducts}
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
          locale={{ emptyText: "No products found." }}
        />
      </ButtonComponentCard>
      {selectedProduct && (
        <EditPurchasedProductModal
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSuccess={() => {
            fetchAllPurchasedProducts(); // Refresh the list
          }}
        />
      )}
    </div>
  );
};

export default ShopOwnerProducts;
